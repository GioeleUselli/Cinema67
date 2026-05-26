using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePremiConMerchVoucher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodiceVoucher",
                table: "PremiRiscatti",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "GiftCardId",
                table: "PremiRiscatti",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MerchOrderId",
                table: "PremiRiscatti",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Taglia",
                table: "PremiRiscatti",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "MerchItemId",
                table: "Premi",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PremiRiscatti_GiftCardId",
                table: "PremiRiscatti",
                column: "GiftCardId");

            migrationBuilder.CreateIndex(
                name: "IX_PremiRiscatti_MerchOrderId",
                table: "PremiRiscatti",
                column: "MerchOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Premi_MerchItemId",
                table: "Premi",
                column: "MerchItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_Premi_MerchItems_MerchItemId",
                table: "Premi",
                column: "MerchItemId",
                principalTable: "MerchItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PremiRiscatti_GiftCards_GiftCardId",
                table: "PremiRiscatti",
                column: "GiftCardId",
                principalTable: "GiftCards",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PremiRiscatti_MerchOrders_MerchOrderId",
                table: "PremiRiscatti",
                column: "MerchOrderId",
                principalTable: "MerchOrders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Premi_MerchItems_MerchItemId",
                table: "Premi");

            migrationBuilder.DropForeignKey(
                name: "FK_PremiRiscatti_GiftCards_GiftCardId",
                table: "PremiRiscatti");

            migrationBuilder.DropForeignKey(
                name: "FK_PremiRiscatti_MerchOrders_MerchOrderId",
                table: "PremiRiscatti");

            migrationBuilder.DropIndex(
                name: "IX_PremiRiscatti_GiftCardId",
                table: "PremiRiscatti");

            migrationBuilder.DropIndex(
                name: "IX_PremiRiscatti_MerchOrderId",
                table: "PremiRiscatti");

            migrationBuilder.DropIndex(
                name: "IX_Premi_MerchItemId",
                table: "Premi");

            migrationBuilder.DropColumn(
                name: "CodiceVoucher",
                table: "PremiRiscatti");

            migrationBuilder.DropColumn(
                name: "GiftCardId",
                table: "PremiRiscatti");

            migrationBuilder.DropColumn(
                name: "MerchOrderId",
                table: "PremiRiscatti");

            migrationBuilder.DropColumn(
                name: "Taglia",
                table: "PremiRiscatti");

            migrationBuilder.DropColumn(
                name: "MerchItemId",
                table: "Premi");
        }
    }
}
