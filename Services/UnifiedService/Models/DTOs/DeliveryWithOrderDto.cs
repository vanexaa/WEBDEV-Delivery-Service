namespace DeliveryService.Models.DTOs;

/// <summary>
/// DTO for delivery with order information (for Admin dashboard)
/// </summary>
public class DeliveryWithOrderDto
{
    public int DeliveryId { get; set; }
    public int OrderId { get; set; }
    public int? RiderId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? TransactionCode { get; set; } // Generated transaction code (e.g., ORD-{OrderId})
    
    // Order information
    public OrderInfoDto? Order { get; set; }
}

public class OrderInfoDto
{
    public int OrderId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string? SpecialInstructions { get; set; }
}
