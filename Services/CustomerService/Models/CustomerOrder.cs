namespace CustomerService.Models;

public class CustomerOrder
{
    public int OrderRefId { get; set; }
    public int CustomerId { get; set; }
    public int OrderId { get; set; } // Reference to DeliveryService OrderId
    public int? DeliveryId { get; set; } // Reference to DeliveryService DeliveryId
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Customer? Customer { get; set; }
}
