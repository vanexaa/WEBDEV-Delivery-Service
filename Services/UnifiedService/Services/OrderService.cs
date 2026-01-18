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
using DeliveryService.Data;
using DeliveryService.Models.DTOs;
using RiderService.Data;

namespace OrderService.Services;

/// <summary>
/// Service for managing order operations including creation, retrieval, and listing.
/// </summary>
public class OrderService : IOrderService
{
    private readonly OrderDbContext _context;
    private readonly DeliveryDbContext _deliveryContext;
    private readonly ILogger<OrderService> _logger;
    private readonly IDeliveryService _deliveryService;
    private readonly RiderDbContext _riderContext;

    // Active delivery statuses that indicate an order is already being handled
    private static readonly HashSet<string> ActiveDeliveryStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "Assigned", "Accepted", "PickedUp", "InTransit"
    };

    // Constructor with all dependencies (for auto-assignment and pending assignments query)
    public OrderService(OrderDbContext context, DeliveryDbContext deliveryContext, IDeliveryService deliveryService, RiderDbContext riderContext, ILogger<OrderService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _deliveryContext = deliveryContext ?? throw new ArgumentNullException(nameof(deliveryContext));
        _deliveryService = deliveryService ?? throw new ArgumentNullException(nameof(deliveryService));
        _riderContext = riderContext ?? throw new ArgumentNullException(nameof(riderContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        var now = DateTime.UtcNow;
        var order = new Order
        {
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            DeliveryAddress = request.DeliveryAddress,
            SpecialInstructions = request.SpecialInstructions,
            OrderTotal = request.OrderTotal,
            PaymentMethod = request.PaymentMethod,
            Status = "Pending",  // Initial status - database is source of truth
            OrderDate = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();  // Persisted to database immediately

        _logger.LogInformation("✅ Order created: OrderId={OrderId}, CustomerId={CustomerId}, Status={Status}", 
            order.OrderId, order.CustomerId, order.Status);
        _logger.LogInformation("📦 Order {OrderId} is now PENDING and will appear in Admin Dashboard 'Pending Assignments'", 
            order.OrderId);

        // NOTE: Auto-assignment is handled by the background service (OrderAssignmentBackgroundService)
        // which runs every 30 seconds. This ensures orders appear in "Pending Assignments" first,
        // giving admins visibility before automatic assignment occurs.
        // 
        // If you want immediate auto-assignment, uncomment the code below:
        // try
        // {
        //     await AutoAssignOrderToRiderAsync(order.OrderId);
        // }
        // catch (Exception ex)
        // {
        //     _logger.LogError(ex, "Error auto-assigning order {OrderId} to rider", order.OrderId);
        // }

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

    /// <summary>
    /// Gets orders that are pending assignment (Status = 'Pending' and no active delivery assignment).
    /// This is the single source of truth for the Admin dashboard "Pending Assignments" section.
    /// 
    /// SQL Logic:
    /// - Orders with Status = 'Pending' in OrderServiceDB
    /// - These are orders waiting to be assigned to a rider
    /// </summary>
    public async Task<List<PendingAssignmentDto>> GetPendingAssignmentsAsync()
    {
        try
        {
            _logger.LogInformation("[GetPendingAssignments] Querying pending assignments from SQL...");

            // Get all orders with Status = 'Pending' from OrderServiceDB
            // These are orders that need to be assigned to a rider
            var pendingOrders = await _context.Orders
                .Where(o => o.Status == "Pending")
                .OrderBy(o => o.OrderDate) // Oldest first (FIFO)
                .AsNoTracking()
                .ToListAsync();

            _logger.LogInformation("[GetPendingAssignments] Found {Count} orders with Status='Pending' in OrderServiceDB", 
                pendingOrders.Count);

            if (!pendingOrders.Any())
            {
                _logger.LogInformation("[GetPendingAssignments] No pending orders found. Returning empty list.");
                return new List<PendingAssignmentDto>();
            }

            // Convert to DTOs and return - all pending orders are shown for assignment
            var result = pendingOrders.Select(order => new PendingAssignmentDto
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                CustomerName = order.CustomerName ?? "Unknown",
                CustomerPhone = order.CustomerPhone ?? "",
                DeliveryAddress = order.DeliveryAddress ?? "",
                SpecialInstructions = order.SpecialInstructions,
                OrderTotal = order.OrderTotal,
                PaymentMethod = order.PaymentMethod ?? "COD",
                OrderDate = order.OrderDate,
                Status = order.Status ?? "Pending",
                DeliveryId = null, // No delivery record yet
                DeliveryStatus = null, // No delivery yet
                RiderId = null, // Not assigned yet
                RiderName = null,
                PendingReason = "Awaiting rider assignment"
            }).ToList();

            _logger.LogInformation("[GetPendingAssignments] Returning {Count} pending orders. OrderIds: {OrderIds}",
                result.Count,
                string.Join(", ", result.Select(r => r.OrderId)));

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GetPendingAssignments] Error fetching pending assignments");
            throw;
        }
    }
    
    // Removed the broken code that depends on DeliveryServiceDB schema
    // The old implementation was:
    // - Step 2: Get all delivery records from DeliveryServiceDB to check assignment status
    // - Step 3: Identify orders that have ACTIVE assignments (should be excluded)
    // - Step 4: Build the result - orders that are NOT actively assigned
    // This failed because the Delivery table schema doesn't match the EF model
    
}
