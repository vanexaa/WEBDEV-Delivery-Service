/*
 * UnifiedService Architecture - Order Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines order service contract.
 */
using OrderService.Models;
using OrderService.Models.DTOs;

namespace OrderService.Services;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request);
    Task<List<Order>> GetAllOrdersAsync();
    Task<List<Order>> GetOrdersByCustomerIdAsync(int customerId);
    Task<Order?> GetOrderByIdAsync(int orderId);
    
    /// <summary>
    /// Gets orders that are pending assignment (Status = 'Pending' and no active delivery assignment).
    /// This is the single source of truth for the Admin dashboard "Pending Assignments" section.
    /// </summary>
    Task<List<PendingAssignmentDto>> GetPendingAssignmentsAsync();
}
