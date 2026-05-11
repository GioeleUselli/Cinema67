using Microsoft.EntityFrameworkCore;
using FilmAPI.Model;

namespace FilmAPI.Data;

public class FilmDbContext : DbContext
{
    public FilmDbContext(DbContextOptions<FilmDbContext> options) : base(options)
    {
    }

    public DbSet<Regista> Registi { get; set; }
    public DbSet<Film> Films { get; set; }
    public DbSet<Cinema> Cinemas { get; set; }
    public DbSet<Proiezione> Proiezioni { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Prenotazione> Prenotazioni { get; set; }
    public DbSet<Categoria> Categorie { get; set; }
    public DbSet<FilmCategoria> FilmCategorie { get; set; }
    public DbSet<Sala> Sale { get; set; }
    public DbSet<SalaPosto> SalaPosti { get; set; }
    public DbSet<Show> Shows { get; set; }
    public DbSet<ShowPostoStato> ShowPostiStato { get; set; }
    public DbSet<Ordine> Ordini { get; set; }
    public DbSet<Biglietto> Biglietti { get; set; }
    public DbSet<MovimentoCredito> MovimentiCredito { get; set; }
    public DbSet<SupportConversation> SupportConversations { get; set; }
    public DbSet<SupportMessage> SupportMessages { get; set; }
    public DbSet<SupportTicket> SupportTickets { get; set; }
    public DbSet<SupportTicketAudit> SupportTicketAudits { get; set; }
    public DbSet<Promotion> Promotions { get; set; }
    public DbSet<GiftCard> GiftCards { get; set; }
    public DbSet<MembershipCard> MembershipCards { get; set; }
    public DbSet<PuntiMovimento> PuntiMovimenti { get; set; }
    public DbSet<Premio> Premi { get; set; }
    public DbSet<PremioRiscatto> PremiRiscatti { get; set; }
    public DbSet<NewsletterSubscriber> NewsletterSubscribers { get; set; }
    public DbSet<NewsletterScheduled> NewsletterScheduleds { get; set; }
    public DbSet<CampaignConfig> CampaignConfigs { get; set; }
    public DbSet<PartyBooking> PartyBookings { get; set; }
    public DbSet<PartyFeedback> PartyFeedbacks { get; set; }
    public DbSet<ShowCancellation> ShowCancellations { get; set; }
    public DbSet<OrdineRefund> OrdineRefunds { get; set; }
    public DbSet<ManualRefundReview> ManualRefundReviews { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<UserCinemaAssignment> UserCinemaAssignments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Proiezione>(entity =>
        {
            entity.HasIndex(e => new { e.CinemaId, e.FilmId, e.Data, e.Ora })
                  .IsUnique();
        });

        modelBuilder.Entity<Film>(entity =>
        {
            entity.HasOne(f => f.Regista)
                  .WithMany(r => r.Films)
                  .HasForeignKey(f => f.RegistaId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Proiezione>(entity =>
        {
            entity.HasOne(p => p.Cinema)
                  .WithMany(c => c.Proiezioni)
                  .HasForeignKey(p => p.CinemaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Film)
                  .WithMany(f => f.Proiezioni)
                  .HasForeignKey(p => p.FilmId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FilmCategoria>(entity =>
        {
            entity.HasKey(fc => new { fc.FilmId, fc.CategoriaId });

            entity.HasOne(fc => fc.Film)
                  .WithMany(f => f.FilmCategorie)
                  .HasForeignKey(fc => fc.FilmId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(fc => fc.Categoria)
                  .WithMany(c => c.FilmCategorie)
                  .HasForeignKey(fc => fc.CategoriaId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.DeviceId });

            entity.HasOne(rt => rt.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Prenotazione>(entity =>
        {
            entity.HasOne(p => p.User)
                  .WithMany(u => u.Prenotazioni)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Proiezione)
                  .WithMany()
                  .HasForeignKey(p => p.ProiezioneId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasIndex(e => e.Nome).IsUnique();
        });

        modelBuilder.Entity<Sala>(entity =>
        {
            entity.HasIndex(e => new { e.CinemaId, e.NumeroProgressivo })
                  .IsUnique();

            entity.HasOne(s => s.Cinema)
                  .WithMany(c => c.Sale)
                  .HasForeignKey(s => s.CinemaId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SalaPosto>(entity =>
        {
            entity.HasIndex(e => new { e.SalaId, e.Settore, e.Fila, e.Numero })
                  .IsUnique();

            entity.HasOne(sp => sp.Sala)
                  .WithMany(s => s.Posti)
                  .HasForeignKey(sp => sp.SalaId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Show>(entity =>
        {
            entity.HasIndex(e => new { e.CinemaId, e.SalaId, e.StartAtUtc })
                  .IsUnique();
            entity.HasIndex(e => e.StartAtUtc);

            entity.HasOne(s => s.Cinema)
                  .WithMany()
                  .HasForeignKey(s => s.CinemaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Sala)
                  .WithMany(sa => sa.Shows)
                  .HasForeignKey(s => s.SalaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Film)
                  .WithMany(f => f.Shows)
                  .HasForeignKey(s => s.FilmId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShowPostoStato>(entity =>
        {
            entity.HasIndex(e => new { e.ShowId, e.SalaPostoId })
                  .IsUnique();
            entity.HasIndex(e => e.HoldToken);
            entity.HasIndex(e => e.ScadeAtUtc);

            entity.HasOne(sps => sps.Show)
                  .WithMany(s => s.PostiStato)
                  .HasForeignKey(sps => sps.ShowId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sps => sps.SalaPosto)
                  .WithMany()
                  .HasForeignKey(sps => sps.SalaPostoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sps => sps.User)
                  .WithMany()
                  .HasForeignKey(sps => sps.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sps => sps.Ordine)
                  .WithMany()
                  .HasForeignKey(sps => sps.OrdineId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Ordine>(entity =>
        {
            entity.HasIndex(e => e.CodiceOrdine)
                  .IsUnique();
            entity.HasIndex(e => e.IdempotencyKey)
                  .IsUnique();

            entity.HasOne(o => o.User)
                  .WithMany(u => u.Ordini)
                  .HasForeignKey(o => o.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Show)
                  .WithMany(s => s.Ordini)
                  .HasForeignKey(o => o.ShowId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Cinema)
                  .WithMany()
                  .HasForeignKey(o => o.CinemaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Sala)
                  .WithMany()
                  .HasForeignKey(o => o.SalaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Film)
                  .WithMany()
                  .HasForeignKey(o => o.FilmId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Biglietto>(entity =>
        {
            entity.HasIndex(e => new { e.ShowId, e.SalaPostoId })
                  .IsUnique();
            entity.HasIndex(e => e.CodiceBiglietto)
                  .IsUnique();
            entity.HasIndex(e => e.UserId);

            entity.HasOne(b => b.Ordine)
                  .WithMany(o => o.Biglietti)
                  .HasForeignKey(b => b.OrdineId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Show)
                  .WithMany(s => s.Biglietti)
                  .HasForeignKey(b => b.ShowId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.SalaPosto)
                  .WithMany()
                  .HasForeignKey(b => b.SalaPostoId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.User)
                  .WithMany(u => u.Biglietti)
                  .HasForeignKey(b => b.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.ValidatoDaUser)
                  .WithMany()
                  .HasForeignKey(b => b.ValidatoDaUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.ValidatoCinema)
                  .WithMany()
                  .HasForeignKey(b => b.ValidatoCinemaId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MovimentoCredito>(entity =>
        {
            entity.HasOne(mc => mc.User)
                  .WithMany()
                  .HasForeignKey(mc => mc.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(mc => mc.OperatoreUser)
                  .WithMany()
                  .HasForeignKey(mc => mc.OperatoreUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(mc => mc.Cinema)
                  .WithMany()
                  .HasForeignKey(mc => mc.CinemaId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(mc => mc.Ordine)
                  .WithMany()
                  .HasForeignKey(mc => mc.OrdineId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasOne(u => u.CinemaPreferito)
                  .WithMany()
                  .HasForeignKey(u => u.CinemaPreferitoId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SupportConversation>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.UpdatedAtUtc);

            entity.HasOne(c => c.User)
                  .WithMany(u => u.SupportConversations)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupportMessage>(entity =>
        {
            entity.HasIndex(e => e.ConversationId);
            entity.HasIndex(e => e.CreatedAtUtc);

            entity.HasOne(m => m.Conversation)
                  .WithMany(c => c.Messages)
                  .HasForeignKey(m => m.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                  .WithMany()
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SupportTicket>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.UpdatedAtUtc);

            entity.HasOne(t => t.Conversation)
                  .WithMany(c => c.Tickets)
                  .HasForeignKey(t => t.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.User)
                  .WithMany(u => u.SupportTickets)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.AssignedAdminUser)
                  .WithMany()
                  .HasForeignKey(t => t.AssignedAdminUserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SupportTicketAudit>(entity =>
        {
            entity.HasIndex(e => e.TicketId);
            entity.HasIndex(e => e.CreatedAtUtc);

            entity.HasOne(a => a.Ticket)
                  .WithMany(t => t.Audits)
                  .HasForeignKey(a => a.TicketId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.ActorUser)
                  .WithMany()
                  .HasForeignKey(a => a.ActorUserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasIndex(e => e.Active);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.StartDate);
        });

        modelBuilder.Entity<GiftCard>(entity =>
        {
            entity.HasIndex(e => e.Codice).IsUnique();
            entity.HasIndex(e => e.Stato);
            entity.HasIndex(e => e.AcquirenteUserId);
            entity.HasIndex(e => e.RiscattataDaUserId);

            entity.HasOne(g => g.AcquirenteUser)
                  .WithMany()
                  .HasForeignKey(g => g.AcquirenteUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(g => g.RiscattataDaUser)
                  .WithMany()
                  .HasForeignKey(g => g.RiscattataDaUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(g => g.Ordine)
                  .WithMany()
                  .HasForeignKey(g => g.OrdineId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MembershipCard>(entity =>
        {
            entity.HasIndex(e => e.CardNumber).IsUnique();
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(m => m.User)
                  .WithMany()
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PuntiMovimento>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAtUtc);

            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.MembershipCard)
                  .WithMany()
                  .HasForeignKey(p => p.MembershipCardId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Premio>(entity =>
        {
            entity.HasIndex(e => e.Attivo);
        });

        modelBuilder.Entity<PremioRiscatto>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Codice).IsUnique();

            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Premio)
                  .WithMany()
                  .HasForeignKey(r => r.PremioId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<NewsletterSubscriber>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.CodiceSconto).IsUnique();
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAtUtc);

            entity.HasOne(t => t.User)
                  .WithMany()
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserCinemaAssignment>(entity => {
            entity.HasIndex(e => new { e.UserId, e.CinemaId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CinemaId);
            entity.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Cinema).WithMany().HasForeignKey(a => a.CinemaId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.CreatedByUser).WithMany().HasForeignKey(a => a.CreatedByUserId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
