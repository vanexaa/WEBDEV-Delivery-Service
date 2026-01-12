using Microsoft.EntityFrameworkCore;
using OrderService.Data;
using OrderService.Models;
using OrderService.Models.DTOs;

namespace OrderService.Services;

public class OrderService : IOrderService
{
    private readonly OrderDbContext _context;
    private readonly ILogger<OrderService> _logger;

    public OrderService(OrderDbContext context, ILogger<OrderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        var order = new Order
        {
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            DeliveryAddress = request.DeliveryAddress,
            SpecialInstructions = request.SpecialInstructions,
            OrderTotal = request.OrderTotal,
            PaymentMethod = request.PaymentMethod,
            Status = "Pending",
            OrderDate = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return order;
    }

    public async Task<List<Order>> GetAllOrdersAsync()
    {
        return await _context.Orders
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
    }

    public async Task<Order?> GetOrderByIdAsync(int orderId)
    {
        return await _context.Orders.FindAsync(orderId);
    }
}
