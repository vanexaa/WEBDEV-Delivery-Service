namespace OrderService.Models;

/// <summary>
/// Order entity - stored in OrderServiceDB.
/// The database is the single source of truth for order data.
/// </summary>
public class Order
{
    public int OrderId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string? SpecialInstructions { get; set; }
    public decimal OrderTotal { get; set; }
    public string PaymentMethod { get; set; } = "COD";
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Order status - valid values: Pending, Assigned, Accepted, PickedUp, InTransit, Delivered, Cancelled
    /// </summary>
    public string Status { get; set; } = "Pending";
    
    /// <summary>
    /// Timestamp when order was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Timestamp when order was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
