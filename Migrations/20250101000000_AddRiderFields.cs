using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ayawkomagbackend.Migrations
{
    /// <inheritdoc />
    public partial class AddRiderFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VehicleType",
                table: "Riders",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Capacity",
                table: "Riders",
                type: "int",
                nullable: false,
                defaultValue: 5);

            migrationBuilder.AddColumn<DateTime>(
                name: "BlockedUntil",
                table: "Riders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Riders",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Riders",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "BlockedUntil",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Riders");
        }
    }
}
