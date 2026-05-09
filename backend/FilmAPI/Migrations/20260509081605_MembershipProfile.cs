using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class MembershipProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cap",
                table: "MembershipCards",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Citta",
                table: "MembershipCards",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataNascita",
                table: "MembershipCards",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provincia",
                table: "MembershipCards",
                type: "varchar(5)",
                maxLength: 5,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Via",
                table: "MembershipCards",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cap",
                table: "MembershipCards");

            migrationBuilder.DropColumn(
                name: "Citta",
                table: "MembershipCards");

            migrationBuilder.DropColumn(
                name: "DataNascita",
                table: "MembershipCards");

            migrationBuilder.DropColumn(
                name: "Provincia",
                table: "MembershipCards");

            migrationBuilder.DropColumn(
                name: "Via",
                table: "MembershipCards");
        }
    }
}
