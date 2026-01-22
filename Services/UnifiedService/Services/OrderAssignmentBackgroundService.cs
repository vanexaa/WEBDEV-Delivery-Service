/*
 * Database-First Architecture - Order Assignment Background Service
 * 
 * ARCHITECTURAL RULES ENFORCED:
 * - ALL data access through stored procedures only
 * - NO LINQ queries against DbSets
 * - Service layer only executes SPs and interprets results
 * 
 * This background service periodically checks for pending/unassigned orders
 * and automatically assigns them to available online riders.
 */
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using DeliveryService.Services;
using DeliveryService.Models.DTOs;
using OrderService.Data;
using DeliveryService.Data;
using RiderService.Data;

namespace UnifiedService.Services;

/// <summary>
/// Background service that periodically checks for pending/unassigned orders
/// and automatically assigns them to available online riders.
/// All data access through stored procedures.
/// </summary>
public class OrderAssignmentBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderAssignmentBackgroundService> _logger;
    private readonly bool _autoAssignmentEnabled;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30);

    public OrderAssignmentBackgroundService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<OrderAssignmentBackgroundService> logger)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _autoAssignmentEnabled = configuration.GetValue("AutoAssignment:Enabled", false);
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_autoAssignmentEnabled)
        {
            _logger.LogInformation("OrderAssignmentBackgroundService is disabled (AutoAssignment:Enabled = false).");
            return;
        }

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

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("OrderAssignmentBackgroundService is stopping.");
    }

    /// <summary>
    /// Finds pending/unassigned orders and assigns them to available online riders.
    /// Uses stored procedures for all data access.
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
            // Get all pending orders via stored procedure
            var pendingOrders = await orderContext.SpOrderGetPendingAsync();

            if (!pendingOrders.Any())
            {
                return;
            }

            _logger.LogInformation("🔍 Background Service: Found {Count} pending orders to check for assignment", pendingOrders.Count);

            // Get all existing deliveries via stored procedure
            var existingDeliveries = await deliveryContext.SpDeliveryGetAllAsync();

            // Find orders that have active assignments (should not be reassigned)
            var assignedOrderIds = existingDeliveries
                .Where(d => d.RiderId.HasValue && 
                           (d.Status == "Assigned" || d.Status == "Accepted" || d.Status == "PickedUp" || d.Status == "InTransit"))
                .Select(d => d.OrderId)
                .ToHashSet();

            // Get orders that need assignment (not already assigned)
            var ordersToAssign = pendingOrders
                .Where(o => !assignedOrderIds.Contains(o.OrderId))
                .OrderBy(o => o.OrderDate) // Assign oldest orders first
                .ToList();

            if (!ordersToAssign.Any())
            {
                _logger.LogInformation("✅ Background Service: No unassigned pending orders found.");
                return;
            }

            _logger.LogInformation("📦 Background Service: Found {Count} unassigned pending orders to assign (Orders: {OrderIds})", 
                ordersToAssign.Count, string.Join(", ", ordersToAssign.Select(o => o.OrderId)));

            // Get available online riders via stored procedure
            var onlineRiders = await riderContext.SpRiderGetOnlineAsync();

            if (!onlineRiders.Any())
            {
                _logger.LogInformation("⚠️ Background Service: No online riders available. {Count} orders remain pending.", ordersToAssign.Count);
                return;
            }

            var onlineRiderIds = onlineRiders.Select(r => r.RiderId).ToList();

            _logger.LogInformation("🚴 Background Service: Found {Count} online riders available for assignment (RiderIds: {RiderIds})", 
                onlineRiderIds.Count, string.Join(", ", onlineRiderIds));

            // Calculate active delivery counts per rider for load balancing
            var riderActiveDeliveryCountsDict = existingDeliveries
                .Where(d => d.RiderId.HasValue && 
                           (d.Status == "Assigned" || d.Status == "Accepted" || d.Status == "PickedUp" || d.Status == "InTransit"))
                .GroupBy(d => d.RiderId!.Value)
                .ToDictionary(g => g.Key, g => g.Count());

            // Assign orders to riders (load balancing: assign to rider with fewest active deliveries)
            int assignedCount = 0;
            foreach (var order in ordersToAssign)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                try
                {
                    // Select rider with fewest active deliveries
                    var riderId = onlineRiderIds
                        .Select(rId => new
                        {
                            RiderId = rId,
                            ActiveCount = riderActiveDeliveryCountsDict.TryGetValue(rId, out var count) ? count : 0
                        })
                        .OrderBy(r => r.ActiveCount)
                        .First()
                        .RiderId;

                    var activeCount = riderActiveDeliveryCountsDict.TryGetValue(riderId, out var cnt) ? cnt : 0;
                    
                    _logger.LogInformation("🔄 Background Service: Assigning pending OrderId={OrderId} to RiderId={RiderId} (Active deliveries: {ActiveCount})",
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
                        _logger.LogInformation("✅ Background Service: Successfully assigned pending OrderId={OrderId} to RiderId={RiderId}, DeliveryId={DeliveryId}",
                            order.OrderId, riderId, delivery.DeliveryId);

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
                        _logger.LogWarning("❌ Background Service: Failed to assign pending OrderId={OrderId} to RiderId={RiderId}",
                            order.OrderId, riderId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error assigning pending OrderId={OrderId}", order.OrderId);
                }
            }

            if (assignedCount > 0)
            {
                _logger.LogInformation("🎉 Background Service: Successfully assigned {AssignedCount}/{TotalCount} pending orders",
                    assignedCount, ordersToAssign.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AssignPendingOrdersAsync");
        }
    }
}
