using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DeliveryService.Migrations;

public partial class AddAcceptedAtToDeliveries : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "AcceptedAt",
            table: "Deliveries",
            type: "datetime",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AcceptedAt",
            table: "Deliveries");
    }
}
