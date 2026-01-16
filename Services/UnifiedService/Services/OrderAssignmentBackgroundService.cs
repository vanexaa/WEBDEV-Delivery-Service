/*
 * UnifiedService Architecture - Order Assignment Background Service
 * 
 * This background service periodically checks for pending/unassigned orders
 * and automatically assigns them to available online riders.
 * 
 * Part of UnifiedService on port 5000.
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using DeliveryService.Services;
using DeliveryService.Models.DTOs;
using OrderService.Data;
using DeliveryService.Data;
using RiderService.Data;
using OrderService.Models;

namespace UnifiedService.Services;

/// <summary>
/// Background service that periodically checks for pending/unassigned orders
/// and automatically assigns them to available online riders.
/// </summary>
public class OrderAssignmentBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderAssignmentBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30); // Check every 30 seconds

    public OrderAssignmentBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<OrderAssignmentBackgroundService> logger)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OrderAssignmentBackgroundService started. Checking for pending orders every {Interval} seconds.", 
            _checkInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await AssignPendingOrdersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OrderAssignmentBackgroundService execution cycle");
            }

            // Wait for the specified interval before checking again
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("OrderAssignmentBackgroundService is stopping.");
    }

    /// <summary>
    /// Finds pending/unassigned orders and assigns them to available online riders.
    /// </summary>
    private async Task AssignPendingOrdersAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var orderContext = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
        var deliveryContext = scope.ServiceProvider.GetRequiredService<DeliveryDbContext>();
        var riderContext = scope.ServiceProvider.GetRequiredService<RiderDbContext>();
        var deliveryService = scope.ServiceProvider.GetRequiredService<IDeliveryService>();

        try
        {
            // Find orders that are pending and don't have an assigned delivery
            // Orders with status "Pending" that either:
            // 1. Don't have a delivery record at all, OR
            // 2. Have a delivery record but no RiderId assigned (status is "Pending" or RiderId is null)

            // Get all pending orders
            var pendingOrders = await orderContext.Orders
                .Where(o => o.Status == "Pending")
                .OrderBy(o => o.OrderDate) // Assign oldest orders first
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            if (!pendingOrders.Any())
            {
                // No pending orders to assign
                return;
            }

            _logger.LogInformation("🔍 Background Service: Found {Count} pending orders to check for assignment", pendingOrders.Count);

            // Get all existing deliveries to check which orders already have deliveries
            var existingDeliveries = await deliveryContext.Deliveries
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            // Find orders that have active assignments (should not be reassigned)
            var assignedOrderIds = existingDeliveries
                .Where(d => d.RiderId.HasValue && 
                           (d.Status == "Assigned" || d.Status == "Accepted" || d.Status == "PickedUp" || d.Status == "InTransit"))
                .Select(d => d.OrderId)
                .ToHashSet();

            // Find orders that have deliveries but are unassigned (RiderId is null or status is "Pending")
            var unassignedDeliveryOrderIds = existingDeliveries
                .Where(d => d.RiderId == null || d.Status == "Pending")
                .Select(d => d.OrderId)
                .ToHashSet();

            // Get orders that need assignment:
            // 1. Orders without any delivery record
            // 2. Orders with delivery records but no active assignment
            var ordersToAssign = pendingOrders
                .Where(o => !assignedOrderIds.Contains(o.OrderId))
                .ToList();

            if (!ordersToAssign.Any())
            {
                _logger.LogInformation("✅ Background Service: No unassigned pending orders found. All pending orders already have active assignments.");
                return;
            }

            _logger.LogInformation("📦 Background Service: Found {Count} unassigned pending orders to assign (Orders: {OrderIds})", 
                ordersToAssign.Count, string.Join(", ", ordersToAssign.Select(o => o.OrderId)));

            // Get available online riders
            var onlineRiders = await riderContext.RiderAvailability
                .Where(ra => ra.IsOnline == true)
                .Select(ra => ra.RiderId)
                .ToListAsync(cancellationToken);

            if (!onlineRiders.Any())
            {
                _logger.LogInformation("⚠️ Background Service: No online riders available. {Count} orders remain pending and will be retried later.", ordersToAssign.Count);
                return;
            }

            _logger.LogInformation("🚴 Background Service: Found {Count} online riders available for assignment (RiderIds: {RiderIds})", 
                onlineRiders.Count, string.Join(", ", onlineRiders));

            // Get active delivery counts per rider for load balancing (using Dictionary for mutability)
            var riderActiveDeliveryCountsDict = (await deliveryContext.Deliveries
                .Where(d => d.RiderId.HasValue && 
                           (d.Status == "Assigned" || d.Status == "Accepted" || d.Status == "PickedUp" || d.Status == "InTransit"))
                .GroupBy(d => d.RiderId.Value)
                .Select(g => new { RiderId = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken))
                .ToDictionary(rac => rac.RiderId, rac => rac.Count);

            // Assign orders to riders (load balancing: assign to rider with fewest active deliveries)
            int assignedCount = 0;
            foreach (var order in ordersToAssign)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                try
                {
                    // Select rider with fewest active deliveries
                    var riderId = onlineRiders
                        .Select(rId => new
                        {
                            RiderId = rId,
                            ActiveCount = riderActiveDeliveryCountsDict.ContainsKey(rId) ? riderActiveDeliveryCountsDict[rId] : 0
                        })
                        .OrderBy(r => r.ActiveCount)
                        .First()
                        .RiderId;

                    var activeCount = riderActiveDeliveryCountsDict.ContainsKey(riderId) ? riderActiveDeliveryCountsDict[riderId] : 0;
                    
                    _logger.LogInformation("🔄 Background Service: Assigning pending OrderId={OrderId} to RiderId={RiderId} (Active deliveries: {ActiveCount}, Load balanced)",
                        order.OrderId, riderId, activeCount);

                    var assignRequest = new AssignDeliveryRequest
                    {
                        OrderId = order.OrderId,
                        RiderId = riderId
                    };

                    var delivery = await deliveryService.AssignDeliveryAsync(assignRequest);

                    if (delivery != null)
                    {
                        assignedCount++;
                        _logger.LogInformation("✅ Background Service: Successfully assigned pending OrderId={OrderId} to RiderId={RiderId}, DeliveryId={DeliveryId}, Status={Status}",
                            order.OrderId, riderId, delivery.DeliveryId, delivery.Status);

                        // Update the count for load balancing
                        if (riderActiveDeliveryCountsDict.ContainsKey(riderId))
                        {
                            riderActiveDeliveryCountsDict[riderId]++;
                        }
                        else
                        {
                            riderActiveDeliveryCountsDict[riderId] = 1;
                        }
                    }
                    else
                    {
                        _logger.LogWarning("❌ Background Service: Failed to assign pending OrderId={OrderId} to RiderId={RiderId}. Will retry next cycle.",
                            order.OrderId, riderId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error assigning pending OrderId={OrderId}", order.OrderId);
                    // Continue with next order
                }
            }

            if (assignedCount > 0)
            {
                _logger.LogInformation("🎉 Background Service: Successfully assigned {AssignedCount}/{TotalCount} pending orders to riders in this cycle",
                    assignedCount, ordersToAssign.Count);
            }
            else if (ordersToAssign.Any() && onlineRiders.Any())
            {
                _logger.LogWarning("⚠️ Background Service: Failed to assign any of {Count} pending orders despite {RiderCount} online riders. Will retry next cycle.",
                    ordersToAssign.Count, onlineRiders.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AssignPendingOrdersAsync");
        }
    }
}
