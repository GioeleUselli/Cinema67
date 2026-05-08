using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class MembershipV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AttivataIl",
                table: "MembershipCards",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataScadenzaAbbonamento",
                table: "MembershipCards",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAttiva",
                table: "MembershipCards",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttivataIl",
                table: "MembershipCards");

            migrationBuilder.DropColumn(
                name: "DataScadenzaAbbonamento",
                table: "MembershipCards");

            migrationBuilder.DropColumn(
                name: "IsAttiva",
                table: "MembershipCards");
        }
    }
}
