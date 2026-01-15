namespace DeliveryService.Models.DTOs;

public class AssignDeliveryRequest
{
    public int OrderId { get; set; }
    public int? RiderId { get; set; } // Optional - if null, auto-assign
}
