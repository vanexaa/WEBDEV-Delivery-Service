namespace DeliveryService.Models;

public class DeliveryOrder
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
    public string Status { get; set; } = "Pending";
}
