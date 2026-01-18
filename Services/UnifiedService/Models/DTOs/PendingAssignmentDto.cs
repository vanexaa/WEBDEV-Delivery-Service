/*
 * UnifiedService Architecture - Pending Assignment DTO
 * 
 * DTO for orders that are pending rider assignment.
 * Used by Admin dashboard to display orders waiting for assignment.
 */
namespace OrderService.Models.DTOs;

/// <summary>
/// Represents an order that is pending assignment to a rider.
/// This is the single source of truth for the Admin dashboard "Pending Assignments" section.
/// </summary>
public class PendingAssignmentDto
{
    /// <summary>Order ID from OrderServiceDB</summary>
    public int OrderId { get; set; }
    
    /// <summary>Customer ID who placed the order</summary>
    public int CustomerId { get; set; }
    
    /// <summary>Customer name for display</summary>
    public string CustomerName { get; set; } = string.Empty;
    
    /// <summary>Customer phone number</summary>
    public string CustomerPhone { get; set; } = string.Empty;
    
    /// <summary>Delivery address</summary>
    public string DeliveryAddress { get; set; } = string.Empty;
    
    /// <summary>Special instructions for delivery</summary>
    public string? SpecialInstructions { get; set; }
    
    /// <summary>Total order amount</summary>
    public decimal OrderTotal { get; set; }
    
    /// <summary>Payment method (Cash, Card, etc.)</summary>
    public string PaymentMethod { get; set; } = string.Empty;
    
    /// <summary>Order status (should be "Pending")</summary>
    public string Status { get; set; } = "Pending";
    
    /// <summary>When the order was placed</summary>
    public DateTime OrderDate { get; set; }
    
    /// <summary>Delivery ID if a delivery record exists (null if no delivery record yet)</summary>
    public int? DeliveryId { get; set; }
    
    /// <summary>Delivery status if a delivery record exists</summary>
    public string? DeliveryStatus { get; set; }
    
    /// <summary>Rider ID if assigned (null if not assigned yet)</summary>
    public int? RiderId { get; set; }
    
    /// <summary>Rider name if assigned</summary>
    public string? RiderName { get; set; }
    
    /// <summary>Indicates why this order is pending assignment</summary>
    public string PendingReason { get; set; } = "No delivery record";
}

