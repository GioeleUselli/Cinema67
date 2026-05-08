using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class GiftCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GiftCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Codice = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValoreIniziale = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    SaldoResiduo = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Stato = table.Column<int>(type: "int", nullable: false),
                    AcquirenteUserId = table.Column<int>(type: "int", nullable: true),
                    RiscattataDaUserId = table.Column<int>(type: "int", nullable: true),
                    OrdineId = table.Column<int>(type: "int", nullable: true),
                    DataAcquisto = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DataRiscatto = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    DataScadenza = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Note = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiftCards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GiftCards_Ordini_OrdineId",
                        column: x => x.OrdineId,
                        principalTable: "Ordini",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GiftCards_Users_AcquirenteUserId",
                        column: x => x.AcquirenteUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GiftCards_Users_RiscattataDaUserId",
                        column: x => x.RiscattataDaUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_GiftCards_AcquirenteUserId",
                table: "GiftCards",
                column: "AcquirenteUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GiftCards_Codice",
                table: "GiftCards",
                column: "Codice",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GiftCards_OrdineId",
                table: "GiftCards",
                column: "OrdineId");

            migrationBuilder.CreateIndex(
                name: "IX_GiftCards_RiscattataDaUserId",
                table: "GiftCards",
                column: "RiscattataDaUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GiftCards_Stato",
                table: "GiftCards",
                column: "Stato");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GiftCards");
        }
    }
}
