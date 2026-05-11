using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class ShowCancellation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "State",
                table: "Shows",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ShowCancellations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ShowId = table.Column<int>(type: "int", nullable: false),
                    CancelledByUserId = table.Column<int>(type: "int", nullable: false),
                    CancelledAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Reason = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotaleDaRimborsare = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TotaleCarta = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TotaleCredito = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    OrdiniTotali = table.Column<int>(type: "int", nullable: false),
                    BigliettiTotali = table.Column<int>(type: "int", nullable: false),
                    RimborsiRiusciti = table.Column<int>(type: "int", nullable: false),
                    RimborsiFalliti = table.Column<int>(type: "int", nullable: false),
                    ManualReviewCount = table.Column<int>(type: "int", nullable: false),
                    EmailsInviate = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    EmailsInviateIl = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ErrorMessage = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowCancellations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShowCancellations_Shows_ShowId",
                        column: x => x.ShowId,
                        principalTable: "Shows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShowCancellations_Users_CancelledByUserId",
                        column: x => x.CancelledByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ManualRefundReviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OrdineId = table.Column<int>(type: "int", nullable: false),
                    ShowCancellationId = table.Column<int>(type: "int", nullable: false),
                    ReasonCode = table.Column<int>(type: "int", nullable: false),
                    Importo = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Resolution = table.Column<int>(type: "int", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResolvedByUserId = table.Column<int>(type: "int", nullable: true),
                    ResolvedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Details = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManualRefundReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManualRefundReviews_Ordini_OrdineId",
                        column: x => x.OrdineId,
                        principalTable: "Ordini",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ManualRefundReviews_ShowCancellations_ShowCancellationId",
                        column: x => x.ShowCancellationId,
                        principalTable: "ShowCancellations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ManualRefundReviews_Users_ResolvedByUserId",
                        column: x => x.ResolvedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "OrdineRefunds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OrdineId = table.Column<int>(type: "int", nullable: false),
                    ShowCancellationId = table.Column<int>(type: "int", nullable: false),
                    ImportoCarta = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ImportoCredito = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    StripeRefundId = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StripeRefundStatus = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreditRefundMovementId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdineRefunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdineRefunds_Ordini_OrdineId",
                        column: x => x.OrdineId,
                        principalTable: "Ordini",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdineRefunds_ShowCancellations_ShowCancellationId",
                        column: x => x.ShowCancellationId,
                        principalTable: "ShowCancellations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ManualRefundReviews_OrdineId",
                table: "ManualRefundReviews",
                column: "OrdineId");

            migrationBuilder.CreateIndex(
                name: "IX_ManualRefundReviews_ResolvedByUserId",
                table: "ManualRefundReviews",
                column: "ResolvedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ManualRefundReviews_ShowCancellationId",
                table: "ManualRefundReviews",
                column: "ShowCancellationId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdineRefunds_OrdineId",
                table: "OrdineRefunds",
                column: "OrdineId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdineRefunds_ShowCancellationId",
                table: "OrdineRefunds",
                column: "ShowCancellationId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowCancellations_CancelledByUserId",
                table: "ShowCancellations",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowCancellations_ShowId",
                table: "ShowCancellations",
                column: "ShowId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ManualRefundReviews");

            migrationBuilder.DropTable(
                name: "OrdineRefunds");

            migrationBuilder.DropTable(
                name: "ShowCancellations");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Shows");
        }
    }
}
