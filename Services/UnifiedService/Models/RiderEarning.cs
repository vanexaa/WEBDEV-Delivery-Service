namespace RiderService.Models;

public class RiderEarning
{
    public int EarningId { get; set; }
    public int RiderId { get; set; }
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public decimal CommissionRate { get; set; } = 10.00m;
    public DateTime EarningDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Pending"; // Pending, Paid, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Rider? Rider { get; set; }
}
