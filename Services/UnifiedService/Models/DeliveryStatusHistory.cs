namespace DeliveryService.Models;

public class DeliveryStatusHistory
{
    public int HistoryId { get; set; }
    public int DeliveryId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? ChangedBy { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Delivery? Delivery { get; set; }
}
