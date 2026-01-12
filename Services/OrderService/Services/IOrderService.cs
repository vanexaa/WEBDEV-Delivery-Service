using OrderService.Models;
using OrderService.Models.DTOs;

namespace OrderService.Services;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request);
    Task<List<Order>> GetAllOrdersAsync();
    Task<Order?> GetOrderByIdAsync(int orderId);
}
