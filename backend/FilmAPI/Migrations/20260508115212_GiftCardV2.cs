using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class GiftCardV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataInvioProgrammato",
                table: "GiftCards",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinatarioEmail",
                table: "GiftCards",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "InviataIl",
                table: "GiftCards",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Messaggio",
                table: "GiftCards",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataInvioProgrammato",
                table: "GiftCards");

            migrationBuilder.DropColumn(
                name: "DestinatarioEmail",
                table: "GiftCards");

            migrationBuilder.DropColumn(
                name: "InviataIl",
                table: "GiftCards");

            migrationBuilder.DropColumn(
                name: "Messaggio",
                table: "GiftCards");
        }
    }
}
