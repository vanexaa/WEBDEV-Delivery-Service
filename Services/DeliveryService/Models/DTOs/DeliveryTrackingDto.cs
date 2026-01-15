namespace DeliveryService.Models.DTOs;

public class DeliveryTrackingDto
{
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public int? RiderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? EstimatedTime { get; set; }
    public List<StatusHistoryItem> StatusHistory { get; set; } = new();
}

public class StatusHistoryItem
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Notes { get; set; }
}
