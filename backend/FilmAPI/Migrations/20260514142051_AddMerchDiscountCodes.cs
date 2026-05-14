using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchDiscountCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StripePaymentIntentId",
                table: "PartyBookings",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "MerchOrderId",
                table: "MovimentiCredito",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CAP",
                table: "MerchOrders",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckoutExpiresAtUtc",
                table: "MerchOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CinemaRitiroId",
                table: "MerchOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Citta",
                table: "MerchOrders",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "CostoSpedizione",
                table: "MerchOrders",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CreditoRiservato",
                table: "MerchOrders",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataConsegnaEffettiva",
                table: "MerchOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataConsegnaPrevista",
                table: "MerchOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataSpedizione",
                table: "MerchOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportoCarta",
                table: "MerchOrders",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ImportoCredito",
                table: "MerchOrders",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Indirizzo",
                table: "MerchOrders",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "LastPaymentError",
                table: "MerchOrders",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAtUtc",
                table: "MerchOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provincia",
                table: "MerchOrders",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StatoSpedizione",
                table: "MerchOrders",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StripeCheckoutSessionId",
                table: "MerchOrders",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StripePaymentIntentId",
                table: "MerchOrders",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "MerchOrders",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TipoConsegna",
                table: "MerchOrders",
                type: "varchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TrackingNumber",
                table: "MerchOrders",
                type: "varchar(30)",
                maxLength: 30,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "Servito",
                table: "FoodOrderItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CAP",
                table: "Cinemas",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MerchDiscountCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Codice = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PercentualeSconto = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Attivo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ScadeIl = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MaxUtilizzi = table.Column<int>(type: "int", nullable: false),
                    Utilizzi = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchDiscountCodes", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MerchItemImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MerchItemId = table.Column<int>(type: "int", nullable: false),
                    Path = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordine = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchItemImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchItemImages_MerchItems_MerchItemId",
                        column: x => x.MerchItemId,
                        principalTable: "MerchItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MerchItemVariants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MerchItemId = table.Column<int>(type: "int", nullable: false),
                    Colore = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Taglia = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Stock = table.Column<int>(type: "int", nullable: false),
                    Prezzo = table.Column<decimal>(type: "decimal(10,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchItemVariants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchItemVariants_MerchItems_MerchItemId",
                        column: x => x.MerchItemId,
                        principalTable: "MerchItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Pacchi",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MerchOrderId = table.Column<int>(type: "int", nullable: false),
                    CodicePacco = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CodiceInterno = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    QrCodeData = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Stato = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PreparatoreId = table.Column<int>(type: "int", nullable: true),
                    CorriereId = table.Column<int>(type: "int", nullable: true),
                    PresoInCaricoIl = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ConsegnatoIl = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    TentataConsegnaIl = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    NoteCorriere = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Firma = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pacchi", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pacchi_MerchOrders_MerchOrderId",
                        column: x => x.MerchOrderId,
                        principalTable: "MerchOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Pacchi_Users_CorriereId",
                        column: x => x.CorriereId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pacchi_Users_PreparatoreId",
                        column: x => x.PreparatoreId,
                        principalTable: "Users",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_MovimentiCredito_MerchOrderId",
                table: "MovimentiCredito",
                column: "MerchOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchOrders_CinemaRitiroId",
                table: "MerchOrders",
                column: "CinemaRitiroId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchItemImages_MerchItemId",
                table: "MerchItemImages",
                column: "MerchItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchItemVariants_MerchItemId",
                table: "MerchItemVariants",
                column: "MerchItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Pacchi_CorriereId",
                table: "Pacchi",
                column: "CorriereId");

            migrationBuilder.CreateIndex(
                name: "IX_Pacchi_MerchOrderId",
                table: "Pacchi",
                column: "MerchOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Pacchi_PreparatoreId",
                table: "Pacchi",
                column: "PreparatoreId");

            migrationBuilder.AddForeignKey(
                name: "FK_MerchOrders_Cinemas_CinemaRitiroId",
                table: "MerchOrders",
                column: "CinemaRitiroId",
                principalTable: "Cinemas",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MovimentiCredito_MerchOrders_MerchOrderId",
                table: "MovimentiCredito",
                column: "MerchOrderId",
                principalTable: "MerchOrders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MerchOrders_Cinemas_CinemaRitiroId",
                table: "MerchOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimentiCredito_MerchOrders_MerchOrderId",
                table: "MovimentiCredito");

            migrationBuilder.DropTable(
                name: "MerchDiscountCodes");

            migrationBuilder.DropTable(
                name: "MerchItemImages");

            migrationBuilder.DropTable(
                name: "MerchItemVariants");

            migrationBuilder.DropTable(
                name: "Pacchi");

            migrationBuilder.DropIndex(
                name: "IX_MovimentiCredito_MerchOrderId",
                table: "MovimentiCredito");

            migrationBuilder.DropIndex(
                name: "IX_MerchOrders_CinemaRitiroId",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "StripePaymentIntentId",
                table: "PartyBookings");

            migrationBuilder.DropColumn(
                name: "MerchOrderId",
                table: "MovimentiCredito");

            migrationBuilder.DropColumn(
                name: "CAP",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "CheckoutExpiresAtUtc",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "CinemaRitiroId",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "Citta",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "CostoSpedizione",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "CreditoRiservato",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "DataConsegnaEffettiva",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "DataConsegnaPrevista",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "DataSpedizione",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "ImportoCarta",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "ImportoCredito",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "Indirizzo",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "LastPaymentError",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "PaidAtUtc",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "Provincia",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "StatoSpedizione",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "StripeCheckoutSessionId",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "StripePaymentIntentId",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "TipoConsegna",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "TrackingNumber",
                table: "MerchOrders");

            migrationBuilder.DropColumn(
                name: "Servito",
                table: "FoodOrderItems");

            migrationBuilder.DropColumn(
                name: "CAP",
                table: "Cinemas");
        }
    }
}
