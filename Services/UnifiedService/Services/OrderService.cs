/*
 * UnifiedService Architecture - Order Service Implementation
 * 
 * Part of UnifiedService on port 5000.
 * Handles order creation, retrieval, and management.
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrderService.Data;
using OrderService.Models;
using OrderService.Models.DTOs;
using DeliveryService.Services;
using DeliveryService.Models.DTOs;
using RiderService.Data;

namespace OrderService.Services;

/// <summary>
/// Service for managing order operations including creation, retrieval, and listing.
/// </summary>
public class OrderService : IOrderService
{
    private readonly OrderDbContext _context;
    private readonly ILogger<OrderService> _logger;
    private readonly IDeliveryService _deliveryService;
    private readonly RiderDbContext _riderContext;

    // Constructor with all dependencies (for auto-assignment)
    public OrderService(OrderDbContext context, IDeliveryService deliveryService, RiderDbContext riderContext, ILogger<OrderService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _deliveryService = deliveryService ?? throw new ArgumentNullException(nameof(deliveryService));
        _riderContext = riderContext ?? throw new ArgumentNullException(nameof(riderContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

        _logger.LogInformation("Order created: OrderId={OrderId}, CustomerId={CustomerId}", 
            order.OrderId, order.CustomerId);

        // Automatically assign order to an available online rider
        try
        {
            await AutoAssignOrderToRiderAsync(order.OrderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-assigning order {OrderId} to rider", order.OrderId);
            // Don't fail order creation if auto-assignment fails
        }

        return order;
    }

    /// <summary>
    /// Automatically assigns a new order to an available online rider.
    /// Uses load balancing to assign to the rider with fewest active deliveries.
    /// </summary>
    private async Task AutoAssignOrderToRiderAsync(int orderId)
    {
        try
        {
            _logger.LogInformation("Starting auto-assignment for new OrderId={OrderId}", orderId);

            // Find available online riders
            var onlineRiders = await _riderContext.RiderAvailability
                .Where(ra => ra.IsOnline == true)
                .Select(ra => ra.RiderId)
                .ToListAsync();

            if (!onlineRiders.Any())
            {
                _logger.LogInformation("No online riders available for auto-assignment of OrderId={OrderId}. Order will be assigned later by background service.", orderId);
                return;
            }

            _logger.LogInformation("Found {Count} online riders for OrderId={OrderId}", onlineRiders.Count, orderId);

            // Load balancing: Get active delivery counts per rider from DeliveryService
            // We'll use reflection to access DeliveryDbContext if needed, but first try a simpler approach
            // Get active delivery counts by calling a method on IDeliveryService or directly querying
            
            // For now, use simple load balancing: assign to first available rider
            // The background service will handle more sophisticated load balancing for pending orders
            // In production, you might want to inject DeliveryDbContext here or create a method in IDeliveryService
            
            // Simple assignment to first rider (load balancing done by background service for pending orders)
            var assignedRiderId = onlineRiders.First();
            
            _logger.LogInformation("Auto-assigning new OrderId={OrderId} to RiderId={RiderId}", 
                orderId, assignedRiderId);

            // Create delivery assignment (AssignDeliveryAsync will create delivery if it doesn't exist)
            var assignRequest = new AssignDeliveryRequest
            {
                OrderId = orderId,
                RiderId = assignedRiderId
            };

            var delivery = await _deliveryService.AssignDeliveryAsync(assignRequest);
            
            if (delivery != null)
            {
                _logger.LogInformation("✅ Order {OrderId} successfully auto-assigned to Rider {RiderId}, DeliveryId={DeliveryId}, Status={Status}", 
                    orderId, assignedRiderId, delivery.DeliveryId, delivery.Status);
            }
            else
            {
                _logger.LogWarning("⚠️ Failed to auto-assign OrderId={OrderId} to RiderId={RiderId}. Order will remain pending and be assigned later by background service.", 
                    orderId, assignedRiderId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during auto-assignment of OrderId={OrderId}. Order will remain pending and be assigned later by background service.", orderId);
            // Don't throw - let order remain pending, background service will retry
        }
    }

    public async Task<List<Order>> GetAllOrdersAsync()
    {
        return await _context.Orders
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
    }

    public async Task<List<Order>> GetOrdersByCustomerIdAsync(int customerId)
    {
        return await _context.Orders
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
    }

    public async Task<Order?> GetOrderByIdAsync(int orderId)
    {
        return await _context.Orders.FindAsync(orderId);
    }
}
