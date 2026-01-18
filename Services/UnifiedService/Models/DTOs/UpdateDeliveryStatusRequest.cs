namespace DeliveryService.Models.DTOs;

public class UpdateDeliveryStatusRequest
{
    public string Status { get; set; } = string.Empty; // Accepted, PickedUp, InTransit, Delivered, Failed
    public string? Notes { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
