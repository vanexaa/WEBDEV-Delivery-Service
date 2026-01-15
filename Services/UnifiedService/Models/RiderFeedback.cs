namespace RiderService.Models;

public class RiderFeedback
{
    public int FeedbackId { get; set; }
    public int RiderId { get; set; }
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public int? CustomerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Rider? Rider { get; set; }
}
