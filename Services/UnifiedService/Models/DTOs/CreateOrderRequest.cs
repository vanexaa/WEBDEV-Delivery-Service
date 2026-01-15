using System.ComponentModel.DataAnnotations;

namespace OrderService.Models.DTOs;

public class CreateOrderRequest
{
    [Required]
    public int CustomerId { get; set; }
    
    [Required]
    [StringLength(255)]
    public string CustomerName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string CustomerPhone { get; set; } = string.Empty;
    
    [Required]
    [StringLength(500)]
    public string DeliveryAddress { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? SpecialInstructions { get; set; }
    
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Order total must be greater than 0")]
    public decimal OrderTotal { get; set; }
    
    public string PaymentMethod { get; set; } = "COD";
}
