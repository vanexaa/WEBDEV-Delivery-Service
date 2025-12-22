using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ayawkomagbackend.Migrations
{
    /// <inheritdoc />
    public partial class addeddeliveryassignmentandfeedback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeliveryAssignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryId = table.Column<int>(type: "int", nullable: false),
                    RiderId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryAssignments", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_DeliveryAssignments_Deliveries_DeliveryId",
                        column: x => x.DeliveryId,
                        principalTable: "Deliveries",
                        principalColumn: "DeliveryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryAssignments_Riders_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Riders",
                        principalColumn: "RiderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Feedbacks",
                columns: table => new
                {
                    FeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryId = table.Column<int>(type: "int", nullable: false),
                    RiderId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveryFailureFailureId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedbacks", x => x.FeedbackId);
                    table.ForeignKey(
                        name: "FK_Feedbacks_Deliveries_DeliveryId",
                        column: x => x.DeliveryId,
                        principalTable: "Deliveries",
                        principalColumn: "DeliveryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Feedbacks_DeliveryFailures_DeliveryFailureFailureId",
                        column: x => x.DeliveryFailureFailureId,
                        principalTable: "DeliveryFailures",
                        principalColumn: "FailureId");
                    table.ForeignKey(
                        name: "FK_Feedbacks_Riders_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Riders",
                        principalColumn: "RiderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_DeliveryId",
                table: "DeliveryAssignments",
                column: "DeliveryId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_RiderId",
                table: "DeliveryAssignments",
                column: "RiderId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_DeliveryFailureFailureId",
                table: "Feedbacks",
                column: "DeliveryFailureFailureId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_DeliveryId",
                table: "Feedbacks",
                column: "DeliveryId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_RiderId",
                table: "Feedbacks",
                column: "RiderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryAssignments");

            migrationBuilder.DropTable(
                name: "Feedbacks");
        }
    }
}
