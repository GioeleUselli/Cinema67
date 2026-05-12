using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class FoodBeverage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FoodOrderItems_FoodItems_FoodItemId",
                table: "FoodOrderItems");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralCodes_Code",
                table: "ReferralCodes",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_FoodOrderItems_FoodItems_FoodItemId",
                table: "FoodOrderItems",
                column: "FoodItemId",
                principalTable: "FoodItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FoodOrderItems_FoodItems_FoodItemId",
                table: "FoodOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_ReferralCodes_Code",
                table: "ReferralCodes");

            migrationBuilder.AddForeignKey(
                name: "FK_FoodOrderItems_FoodItems_FoodItemId",
                table: "FoodOrderItems",
                column: "FoodItemId",
                principalTable: "FoodItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
