using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class CampaignDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GiorniPrima",
                table: "CampaignConfigs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Giorno",
                table: "CampaignConfigs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Mese",
                table: "CampaignConfigs",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GiorniPrima",
                table: "CampaignConfigs");

            migrationBuilder.DropColumn(
                name: "Giorno",
                table: "CampaignConfigs");

            migrationBuilder.DropColumn(
                name: "Mese",
                table: "CampaignConfigs");
        }
    }
}
