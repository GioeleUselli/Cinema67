using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmAPI.Migrations
{
    /// <inheritdoc />
    public partial class PartyV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OraFine",
                table: "PartyBookings",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "OraInizio",
                table: "PartyBookings",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "OrdineId",
                table: "PartyBookings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PartyBookings_OrdineId",
                table: "PartyBookings",
                column: "OrdineId");

            migrationBuilder.AddForeignKey(
                name: "FK_PartyBookings_Ordini_OrdineId",
                table: "PartyBookings",
                column: "OrdineId",
                principalTable: "Ordini",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PartyBookings_Ordini_OrdineId",
                table: "PartyBookings");

            migrationBuilder.DropIndex(
                name: "IX_PartyBookings_OrdineId",
                table: "PartyBookings");

            migrationBuilder.DropColumn(
                name: "OraFine",
                table: "PartyBookings");

            migrationBuilder.DropColumn(
                name: "OraInizio",
                table: "PartyBookings");

            migrationBuilder.DropColumn(
                name: "OrdineId",
                table: "PartyBookings");
        }
    }
}
