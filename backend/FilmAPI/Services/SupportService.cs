using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface ISupportService
{
    Task<SupportConversationDTO> GetOrCreateConversationAsync(int userId);
    Task<SupportChatResponseDTO> SendUserMessageAsync(int userId, SupportChatMessageRequestDTO dto);
    Task<SupportTicketDetailDTO> EscalateToTicketAsync(int userId, SupportEscalateRequestDTO dto);
    Task<List<SupportTicketListItemDTO>> GetAdminTicketsAsync(string? status, string? priority, string? search, int page, int pageSize);
    Task<SupportTicketDetailDTO?> GetAdminTicketByIdAsync(int ticketId);
    Task<SupportTicketDetailDTO?> AdminUpdateTicketAsync(int ticketId, int adminUserId, SupportAdminUpdateTicketRequestDTO dto);
}

public class SupportService : ISupportService
{
    private readonly FilmDbContext _db;

    public SupportService(FilmDbContext db)
    {
        _db = db;
    }

    public async Task<SupportConversationDTO> GetOrCreateConversationAsync(int userId)
    {
        var conversation = await _db.SupportConversations
            .Include(c => c.Messages)
            .Include(c => c.Tickets)
            .ThenInclude(t => t.User)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAtUtc)
            .FirstOrDefaultAsync();

        if (conversation is null)
        {
            conversation = new SupportConversation
            {
                UserId = userId,
                Status = SupportConversationStatus.Open,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _db.SupportConversations.Add(conversation);
            await _db.SaveChangesAsync();

            await AddBotMessageAsync(conversation, userId,
                "Ciao! Sono l'assistente CineAura. Posso aiutarti su pagamenti, biglietti, account e prenotazioni. Raccontami il problema in breve.");
        }

        await _db.Entry(conversation).Collection(c => c.Messages).LoadAsync();
        await _db.Entry(conversation).Collection(c => c.Tickets).LoadAsync();

        return MapConversation(conversation);
    }

    public async Task<SupportChatResponseDTO> SendUserMessageAsync(int userId, SupportChatMessageRequestDTO dto)
    {
        var conversation = await EnsureConversationAsync(userId);
        var input = (dto.Message ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(input))
            throw new ArgumentException("Il messaggio non puo essere vuoto.");

        var now = DateTime.UtcNow;

        _db.SupportMessages.Add(new SupportMessage
        {
            ConversationId = conversation.Id,
            UserId = userId,
            Role = SupportMessageRole.User,
            Message = input,
            CreatedAtUtc = now
        });

        var latestUserMessagesCount = await _db.SupportMessages
            .Where(m => m.ConversationId == conversation.Id && m.Role == SupportMessageRole.User)
            .CountAsync();

        var faq = BuildFaqResponse(input);
        var shouldEscalate = faq.ShouldEscalate || latestUserMessagesCount >= 4;

        _db.SupportMessages.Add(new SupportMessage
        {
            ConversationId = conversation.Id,
            UserId = userId,
            Role = SupportMessageRole.Bot,
            Message = faq.BotReply,
            CreatedAtUtc = now.AddMilliseconds(1)
        });

        conversation.Status = shouldEscalate ? SupportConversationStatus.Escalated : SupportConversationStatus.WaitingUser;
        conversation.UpdatedAtUtc = now;

        await _db.SaveChangesAsync();

        await _db.Entry(conversation).Collection(c => c.Messages).LoadAsync();
        await _db.Entry(conversation).Collection(c => c.Tickets).LoadAsync();

        return new SupportChatResponseDTO
        {
            Conversation = MapConversation(conversation),
            ShouldEscalate = shouldEscalate,
            SuggestedActions = faq.SuggestedActions
        };
    }

    public async Task<SupportTicketDetailDTO> EscalateToTicketAsync(int userId, SupportEscalateRequestDTO dto)
    {
        var conversation = await EnsureConversationAsync(userId);

        var title = (dto.Title ?? string.Empty).Trim();
        var description = (dto.Description ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Titolo ticket obbligatorio.");
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Descrizione ticket obbligatoria.");

        var priority = ParsePriority(dto.Priority, title + " " + description);
        var code = await GenerateTicketCodeAsync();

        var ticket = new SupportTicket
        {
            Code = code,
            ConversationId = conversation.Id,
            UserId = userId,
            Title = title,
            Description = description,
            Priority = priority,
            Status = SupportTicketStatus.Open,
            ContextPage = string.IsNullOrWhiteSpace(dto.ContextPage) ? null : dto.ContextPage.Trim(),
            ContextOrderCode = string.IsNullOrWhiteSpace(dto.ContextOrderCode) ? null : dto.ContextOrderCode.Trim(),
            ContextMetadata = string.IsNullOrWhiteSpace(dto.ContextMetadata) ? null : dto.ContextMetadata.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.SupportTickets.Add(ticket);
        conversation.Status = SupportConversationStatus.Escalated;
        conversation.UpdatedAtUtc = DateTime.UtcNow;

        _db.SupportTicketAudits.Add(new SupportTicketAudit
        {
            Ticket = ticket,
            ActorUserId = userId,
            EventType = "TicketCreated",
            Message = $"Ticket creato da utente con priorita {ticket.Priority}.",
            CreatedAtUtc = DateTime.UtcNow
        });

        _db.SupportMessages.Add(new SupportMessage
        {
            ConversationId = conversation.Id,
            UserId = userId,
            Role = SupportMessageRole.System,
            Message = $"Ticket aperto con successo: {code}. Un amministratore ti rispondera il prima possibile.",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return (await GetAdminTicketByIdAsync(ticket.Id))!;
    }

    public async Task<List<SupportTicketListItemDTO>> GetAdminTicketsAsync(string? status, string? priority, string? search, int page, int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize <= 0 ? 25 : Math.Min(pageSize, 100);

        var query = _db.SupportTickets
            .Include(t => t.User)
            .Include(t => t.AssignedAdminUser)
            .AsQueryable();

        if (TryParseStatus(status, out var parsedStatus))
            query = query.Where(t => t.Status == parsedStatus);

        if (TryParsePriority(priority, out var parsedPriority))
            query = query.Where(t => t.Priority == parsedPriority);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(t =>
                t.Code.ToLower().Contains(term)
                || t.Title.ToLower().Contains(term)
                || (t.User != null && t.User.Email.ToLower().Contains(term)));
        }

        return await query
            .OrderByDescending(t => t.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new SupportTicketListItemDTO
            {
                Id = t.Id,
                Code = t.Code,
                Title = t.Title,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                UserEmail = t.User != null ? t.User.Email : string.Empty,
                AssignedAdminEmail = t.AssignedAdminUser != null ? t.AssignedAdminUser.Email : null,
                CreatedAtUtc = t.CreatedAtUtc,
                UpdatedAtUtc = t.UpdatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<SupportTicketDetailDTO?> GetAdminTicketByIdAsync(int ticketId)
    {
        var ticket = await _db.SupportTickets
            .Include(t => t.User)
            .Include(t => t.AssignedAdminUser)
            .Include(t => t.Conversation)
            .ThenInclude(c => c!.Messages)
            .Include(t => t.Audits)
            .ThenInclude(a => a.ActorUser)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket is null)
            return null;

        return MapTicketDetail(ticket);
    }

    public async Task<SupportTicketDetailDTO?> AdminUpdateTicketAsync(int ticketId, int adminUserId, SupportAdminUpdateTicketRequestDTO dto)
    {
        var ticket = await _db.SupportTickets
            .Include(t => t.Conversation)
            .FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket is null)
            return null;

        var actor = await _db.Users.FindAsync(adminUserId);
        if (actor is null || (actor.Ruolo != UserRole.Admin && actor.Ruolo != UserRole.PowerUser))
            throw new InvalidOperationException("Operatore non autorizzato.");

        if (TryParseStatus(dto.Status, out var parsedStatus))
        {
            var previousStatus = ticket.Status;
            ticket.Status = parsedStatus;
            if (parsedStatus is SupportTicketStatus.Resolved or SupportTicketStatus.Closed)
                ticket.ResolvedAtUtc = DateTime.UtcNow;

            if (previousStatus != parsedStatus)
            {
                _db.SupportTicketAudits.Add(new SupportTicketAudit
                {
                    TicketId = ticket.Id,
                    ActorUserId = adminUserId,
                    EventType = "StatusChanged",
                    Message = $"Stato aggiornato da {previousStatus} a {parsedStatus}.",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.AdminResolutionNote))
        {
            ticket.AdminResolutionNote = dto.AdminResolutionNote.Trim();

            _db.SupportTicketAudits.Add(new SupportTicketAudit
            {
                TicketId = ticket.Id,
                ActorUserId = adminUserId,
                EventType = "ResolutionNoteUpdated",
                Message = "Nota di risoluzione aggiornata.",
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        var previousAssigned = ticket.AssignedAdminUserId;
        if (dto.AssignedAdminUserId.HasValue)
        {
            var assigned = await _db.Users.FindAsync(dto.AssignedAdminUserId.Value);
            if (assigned is null || (assigned.Ruolo != UserRole.Admin && assigned.Ruolo != UserRole.PowerUser))
                throw new ArgumentException("Admin assegnato non valido.");
            ticket.AssignedAdminUserId = assigned.Id;

            if (previousAssigned != assigned.Id)
            {
                _db.SupportTicketAudits.Add(new SupportTicketAudit
                {
                    TicketId = ticket.Id,
                    ActorUserId = adminUserId,
                    EventType = "AssignedAdminChanged",
                    Message = $"Ticket assegnato a {assigned.Email}.",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        else
        {
            ticket.AssignedAdminUserId = adminUserId;

            if (previousAssigned != adminUserId)
            {
                _db.SupportTicketAudits.Add(new SupportTicketAudit
                {
                    TicketId = ticket.Id,
                    ActorUserId = adminUserId,
                    EventType = "AssignedAdminChanged",
                    Message = "Ticket assegnato all'operatore corrente.",
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        ticket.UpdatedAtUtc = DateTime.UtcNow;

        if (ticket.Conversation is not null)
        {
            ticket.Conversation.Status = ticket.Status is SupportTicketStatus.Resolved or SupportTicketStatus.Closed
                ? SupportConversationStatus.Closed
                : SupportConversationStatus.Escalated;
            ticket.Conversation.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return await GetAdminTicketByIdAsync(ticketId);
    }

    private async Task<SupportConversation> EnsureConversationAsync(int userId)
    {
        var conversation = await _db.SupportConversations
            .OrderByDescending(c => c.UpdatedAtUtc)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (conversation is not null)
            return conversation;

        conversation = new SupportConversation
        {
            UserId = userId,
            Status = SupportConversationStatus.Open,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.SupportConversations.Add(conversation);
        await _db.SaveChangesAsync();
        return conversation;
    }

    private async Task AddBotMessageAsync(SupportConversation conversation, int userId, string message)
    {
        _db.SupportMessages.Add(new SupportMessage
        {
            ConversationId = conversation.Id,
            UserId = userId,
            Role = SupportMessageRole.Bot,
            Message = message,
            CreatedAtUtc = DateTime.UtcNow
        });
        conversation.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task<string> GenerateTicketCodeAsync()
    {
        for (var i = 0; i < 8; i++)
        {
            var code = $"SUP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
            var exists = await _db.SupportTickets.AnyAsync(t => t.Code == code);
            if (!exists)
                return code;
        }

        return $"SUP-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    private static bool TryParseStatus(string? raw, out SupportTicketStatus status)
    {
        status = SupportTicketStatus.Open;
        if (string.IsNullOrWhiteSpace(raw))
            return false;
        return Enum.TryParse(raw.Trim(), true, out status);
    }

    private static bool TryParsePriority(string? raw, out SupportTicketPriority priority)
    {
        priority = SupportTicketPriority.Medium;
        if (string.IsNullOrWhiteSpace(raw))
            return false;
        return Enum.TryParse(raw.Trim(), true, out priority);
    }

    private static SupportTicketPriority ParsePriority(string? raw, string textForHeuristics)
    {
        if (TryParsePriority(raw, out var parsed))
            return parsed;

        var text = (textForHeuristics ?? string.Empty).ToLowerInvariant();
        if (text.Contains("pagamento") || text.Contains("addebito") || text.Contains("stripe"))
            return SupportTicketPriority.High;
        if (text.Contains("blocc") || text.Contains("errore 500") || text.Contains("non funziona"))
            return SupportTicketPriority.High;
        return SupportTicketPriority.Medium;
    }

    private static (string BotReply, bool ShouldEscalate, List<string> SuggestedActions) BuildFaqResponse(string input)
    {
        var text = input.ToLowerInvariant();

        if (ContainsAny(text, "pagamento", "carta", "stripe", "addebito"))
        {
            return (
                "Capito. Per i problemi di pagamento prova questi step: 1) aggiorna la pagina pagamento, 2) verifica il metodo selezionato (carta/credito/misto), 3) controlla che il saldo credito sia sufficiente, 4) riprova entro 10 minuti per non perdere i posti. Se continua a fallire, posso aprire subito un ticket ad alta priorita.",
                true,
                new List<string> { "Riprova checkout", "Controlla saldo credito", "Apri ticket pagamento" }
            );
        }

        if (ContainsAny(text, "biglietto", "pdf", "email", "non ricevuto"))
        {
            return (
                "Per i biglietti: vai in Profilo > I Miei Biglietti, poi scarica di nuovo il PDF. Controlla anche spam/posta indesiderata se aspetti l'email. Se il ticket non compare nel profilo, posso aprire un ticket assistenza con il codice ordine.",
                false,
                new List<string> { "Apri profilo biglietti", "Controlla spam", "Apri ticket biglietti" }
            );
        }

        if (ContainsAny(text, "password", "login", "accesso", "sessione", "scaduta"))
        {
            return (
                "Per problemi di accesso: 1) verifica email e password senza spazi, 2) esegui logout/login, 3) se vedi sessione scaduta aggiorna la pagina e rientra. Se l'errore persiste posso aprire ticket per verifica account.",
                false,
                new List<string> { "Logout e nuovo login", "Verifica credenziali", "Apri ticket account" }
            );
        }

        if (ContainsAny(text, "prenotazione", "posti", "sala", "show"))
        {
            return (
                "Se hai problemi in prenotazione posti: aggiorna la mappa, scegli posti disponibili (non riservati/venduti) e completa il pagamento entro il countdown. Se i posti restano bloccati o la mappa e incoerente, apro ticket tecnico.",
                false,
                new List<string> { "Ricarica mappa posti", "Nuova selezione", "Apri ticket tecnico" }
            );
        }

        return (
            "Posso aiutarti su: pagamenti, biglietti, accesso account e prenotazioni. Scrivimi cosa non funziona e in che pagina ti trovi. Se non risolviamo in pochi passaggi apro subito un ticket all'admin.",
            false,
            new List<string> { "Problema pagamento", "Biglietto non ricevuto", "Problema accesso", "Apri ticket" }
        );
    }

    private static bool ContainsAny(string source, params string[] terms)
        => terms.Any(t => source.Contains(t));

    private static SupportConversationDTO MapConversation(SupportConversation conversation)
    {
        return new SupportConversationDTO
        {
            ConversationId = conversation.Id,
            Status = conversation.Status.ToString(),
            UpdatedAtUtc = conversation.UpdatedAtUtc,
            Messages = conversation.Messages
                .OrderBy(m => m.CreatedAtUtc)
                .TakeLast(60)
                .Select(m => new SupportMessageDTO
                {
                    Id = m.Id,
                    Role = m.Role.ToString(),
                    Message = m.Message,
                    CreatedAtUtc = m.CreatedAtUtc
                })
                .ToList(),
            Tickets = conversation.Tickets
                .OrderByDescending(t => t.CreatedAtUtc)
                .Select(t => new SupportTicketListItemDTO
                {
                    Id = t.Id,
                    Code = t.Code,
                    Title = t.Title,
                    Status = t.Status.ToString(),
                    Priority = t.Priority.ToString(),
                    UserEmail = string.Empty,
                    CreatedAtUtc = t.CreatedAtUtc,
                    UpdatedAtUtc = t.UpdatedAtUtc
                })
                .ToList()
        };
    }

    private static SupportTicketDetailDTO MapTicketDetail(SupportTicket ticket)
    {
        var messages = ticket.Conversation?.Messages
            .OrderBy(m => m.CreatedAtUtc)
            .TakeLast(120)
            .Select(m => new SupportMessageDTO
            {
                Id = m.Id,
                Role = m.Role.ToString(),
                Message = m.Message,
                CreatedAtUtc = m.CreatedAtUtc
            })
            .ToList() ?? new List<SupportMessageDTO>();

        var audits = ticket.Audits
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(80)
            .Select(a => new SupportTicketAuditDTO
            {
                Id = a.Id,
                EventType = a.EventType,
                Message = a.Message,
                ActorUserId = a.ActorUserId,
                ActorEmail = a.ActorUser?.Email,
                CreatedAtUtc = a.CreatedAtUtc
            })
            .ToList();

        return new SupportTicketDetailDTO
        {
            Id = ticket.Id,
            Code = ticket.Code,
            Title = ticket.Title,
            Description = ticket.Description,
            Status = ticket.Status.ToString(),
            Priority = ticket.Priority.ToString(),
            UserId = ticket.UserId,
            UserEmail = ticket.User?.Email ?? string.Empty,
            AssignedAdminUserId = ticket.AssignedAdminUserId,
            AssignedAdminEmail = ticket.AssignedAdminUser?.Email,
            ContextPage = ticket.ContextPage,
            ContextOrderCode = ticket.ContextOrderCode,
            ContextMetadata = ticket.ContextMetadata,
            AdminResolutionNote = ticket.AdminResolutionNote,
            CreatedAtUtc = ticket.CreatedAtUtc,
            UpdatedAtUtc = ticket.UpdatedAtUtc,
            ResolvedAtUtc = ticket.ResolvedAtUtc,
            ConversationMessages = messages,
            AuditTrail = audits
        };
    }
}
