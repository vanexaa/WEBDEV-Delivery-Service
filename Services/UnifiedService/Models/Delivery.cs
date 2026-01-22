/*
 * Database-First Architecture - Delivery Model
 * 
 * This model matches the actual database schema in DeliveryServiceDB.
 * Columns are defined by the stored procedures, not by code-first migrations.
 */
namespace DeliveryService.Models;

/// <summary>
/// Delivery entity matching the Deliveries table in DeliveryServiceDB.
/// Only includes columns that exist in the actual database.
/// </summary>
public class Delivery
{
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public int? RiderId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Assigned, Accepted, PickedUp, InTransit, Delivered, Failed
    public DateTime? AssignedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Note: Orders are in OrderServiceDB, not DeliveryServiceDB
    // Navigation property removed - orders must be fetched separately from OrderServiceDB
}
