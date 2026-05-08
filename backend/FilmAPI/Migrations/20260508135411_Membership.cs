using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class Membership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MembershipCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CardNumber = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tier = table.Column<int>(type: "int", nullable: false),
                    PuntiTotali = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PuntiDisponibili = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DataIscrizione = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    QrCodeData = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MembershipCards_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Premi",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descrizione = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CostoPunti = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Valore = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Attivo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    QuantitaDisponibile = table.Column<int>(type: "int", nullable: false),
                    ImmaginePath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Premi", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PuntiMovimenti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    MembershipCardId = table.Column<int>(type: "int", nullable: true),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Punti = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    SaldoPre = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    SaldoPost = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    RiferimentoId = table.Column<int>(type: "int", nullable: true),
                    RiferimentoTipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Note = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PuntiMovimenti", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PuntiMovimenti_MembershipCards_MembershipCardId",
                        column: x => x.MembershipCardId,
                        principalTable: "MembershipCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PuntiMovimenti_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PremiRiscatti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PremioId = table.Column<int>(type: "int", nullable: false),
                    PuntiSpesi = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Codice = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Stato = table.Column<int>(type: "int", nullable: false),
                    DataRiscatto = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataScadenza = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DataUtilizzo = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Note = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PremiRiscatti", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PremiRiscatti_Premi_PremioId",
                        column: x => x.PremioId,
                        principalTable: "Premi",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PremiRiscatti_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_MembershipCards_CardNumber",
                table: "MembershipCards",
                column: "CardNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MembershipCards_UserId",
                table: "MembershipCards",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Premi_Attivo",
                table: "Premi",
                column: "Attivo");

            migrationBuilder.CreateIndex(
                name: "IX_PremiRiscatti_Codice",
                table: "PremiRiscatti",
                column: "Codice",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PremiRiscatti_PremioId",
                table: "PremiRiscatti",
                column: "PremioId");

            migrationBuilder.CreateIndex(
                name: "IX_PremiRiscatti_UserId",
                table: "PremiRiscatti",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PuntiMovimenti_CreatedAtUtc",
                table: "PuntiMovimenti",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_PuntiMovimenti_MembershipCardId",
                table: "PuntiMovimenti",
                column: "MembershipCardId");

            migrationBuilder.CreateIndex(
                name: "IX_PuntiMovimenti_UserId",
                table: "PuntiMovimenti",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PremiRiscatti");

            migrationBuilder.DropTable(
                name: "PuntiMovimenti");

            migrationBuilder.DropTable(
                name: "Premi");

            migrationBuilder.DropTable(
                name: "MembershipCards");
        }
    }
}
