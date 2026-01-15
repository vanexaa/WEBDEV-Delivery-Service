namespace DeliveryService.Models;

public class Delivery
{
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public int? RiderId { get; set; }
    public string Status { get; set; } = "Assigned"; // Assigned, Accepted, PickedUp, InTransit, Delivered, Failed, Cancelled
    public decimal RestaurantLatitude { get; set; }
    public decimal RestaurantLongitude { get; set; }
    public decimal? DeliveryLatitude { get; set; }
    public decimal? DeliveryLongitude { get; set; }
    public int? EstimatedTime { get; set; } // in minutes
    public DateTime? ActualDeliveryTime { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public DeliveryOrder? Order { get; set; }
}
