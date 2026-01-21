/*
 * UnifiedService Architecture - Delivery Controller
 * 
 * This controller is part of the UnifiedService running on port 5000.
 * Benefits: Single port for all services, simpler deployment, easier debugging.
 * 
 * All delivery endpoints are accessible at: http://localhost:5000/api/deliveries/*
 */

using Microsoft.AspNetCore.Mvc;
using DeliveryService.Models.DTOs;
using DeliveryService.Services;

namespace DeliveryService.Controllers;

/// <summary>
/// Controller for managing delivery operations including assignment, status updates, and tracking.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DeliveriesController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;
    private readonly ILogger<DeliveriesController> _logger;

    public DeliveriesController(IDeliveryService deliveryService, ILogger<DeliveriesController> logger)
    {
        _deliveryService = deliveryService ?? throw new ArgumentNullException(nameof(deliveryService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Assign a delivery to a rider (Admin only, or auto-assign if RiderId is null)
    /// </summary>
    [HttpPost("assign")]
    public async Task<ActionResult> AssignDelivery([FromBody] AssignDeliveryRequest request)
    {
        if (request == null)
        {
            _logger.LogWarning("Assign delivery called with null request");
            return BadRequest(new { message = "Request body is required" });
        }

        if (request.OrderId <= 0)
        {
            return BadRequest(new { message = "Invalid order ID" });
        }

        try
        {
            _logger.LogInformation("AssignDelivery request received: OrderId={OrderId}, RiderId={RiderId}",
                request.OrderId, request.RiderId);
            
            if (!request.RiderId.HasValue)
            {
                _logger.LogWarning("RiderId is required for assignment: OrderId={OrderId}", request.OrderId);
                return BadRequest(new { message = "RiderId is required" });
            }

            var delivery = await _deliveryService.AssignDeliveryAsync(request);
            if (delivery == null)
            {
                _logger.LogWarning("Order not found for assignment: OrderId={OrderId}", request.OrderId);
                return NotFound(new { message = "Order not found" });
            }

            _logger.LogInformation("Delivery assigned successfully: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                delivery.DeliveryId, delivery.OrderId, delivery.RiderId);
            
            // Return the delivery with confirmation
            return Ok(new { 
                deliveryId = delivery.DeliveryId,
                orderId = delivery.OrderId,
                riderId = delivery.RiderId,
                status = delivery.Status,
                message = "Delivery assigned successfully"
            });
        }
        catch (InvalidOperationException ex)
        {
            // Handle validation errors (e.g., rider not online)
            _logger.LogWarning("Assignment validation failed for OrderId={OrderId}: {Message}", request.OrderId, ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning delivery for OrderId={OrderId}: {Error}", request.OrderId, ex.Message);
            return StatusCode(500, new { message = "An error occurred", error = ex.Message });
        }
    }

    /// <summary>
    /// Get delivery by order ID
    /// </summary>
    [HttpGet("{orderId}")]
    public async Task<ActionResult> GetDeliveryByOrderId(int orderId)
    {
        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            return Ok(delivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting delivery");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get active deliveries (Rider and Admin)
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult> GetActiveDeliveries()
    {
        try
        {
            var deliveries = await _deliveryService.GetActiveDeliveriesAsync();
            return Ok(deliveries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active deliveries");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get active deliveries with order information (for Admin dashboard)
    /// </summary>
    [HttpGet("active/with-orders")]
    public async Task<ActionResult> GetActiveDeliveriesWithOrders()
    {
        try
        {
            var deliveries = await _deliveryService.GetActiveDeliveriesWithOrdersAsync();
            return Ok(deliveries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active deliveries with orders");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get available deliveries (unassigned or assigned to specific rider)
    /// </summary>
    [HttpGet("available")]
    public async Task<ActionResult> GetAvailableDeliveries([FromQuery] int? riderId = null)
    {
        try
        {
            var deliveries = await _deliveryService.GetAvailableDeliveriesAsync(riderId);
            return Ok(deliveries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available deliveries");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reassign delivery to another rider (Admin only)
    /// </summary>
    [HttpPut("{orderId}/reassign")]
    public async Task<ActionResult> ReassignDelivery(int orderId, [FromBody] ReassignDeliveryRequest request)
    {
        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.ReassignDeliveryAsync(delivery.DeliveryId, request.RiderId);
            return Ok(updatedDelivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reassigning delivery");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update delivery status (Rider)
    /// </summary>
    [HttpPut("{orderId}/status")]
    public async Task<ActionResult> UpdateDeliveryStatus(int orderId, [FromBody] UpdateDeliveryStatusRequest request)
    {
        if (orderId <= 0)
        {
            return BadRequest(new { message = "Invalid order ID" });
        }

        if (request == null)
        {
            _logger.LogWarning("Update delivery status called with null request for OrderId={OrderId}", orderId);
            return BadRequest(new { message = "Request body is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return BadRequest(new { message = "Status is required" });
        }

        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found for OrderId={OrderId}", orderId);
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.UpdateDeliveryStatusAsync(delivery.DeliveryId, request, 0);
            if (updatedDelivery == null)
            {
                return StatusCode(500, new { message = "Failed to update delivery status" });
            }

            _logger.LogInformation("Delivery status updated: DeliveryId={DeliveryId}, OrderId={OrderId}, Status={Status}",
                updatedDelivery.DeliveryId, orderId, request.Status);
            return Ok(updatedDelivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery status for OrderId={OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Mark delivery as failed (Rider and Admin)
    /// </summary>
    [HttpPut("{orderId}/failure")]
    public async Task<ActionResult> MarkDeliveryAsFailed(int orderId, [FromBody] FailureRequest request)
    {
        if (orderId <= 0)
        {
            return BadRequest(new { message = "Invalid order ID" });
        }

        if (request == null)
        {
            _logger.LogWarning("Mark delivery as failed called with null request for OrderId={OrderId}", orderId);
            return BadRequest(new { message = "Request body is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { message = "Failure reason is required" });
        }

        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found for OrderId={OrderId}", orderId);
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.MarkDeliveryAsFailedAsync(delivery.DeliveryId, request.Reason, 0);
            if (updatedDelivery == null)
            {
                return StatusCode(500, new { message = "Failed to mark delivery as failed" });
            }

            _logger.LogInformation("Delivery marked as failed: DeliveryId={DeliveryId}, OrderId={OrderId}, Reason={Reason}",
                updatedDelivery.DeliveryId, orderId, request.Reason);
            return Ok(updatedDelivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking delivery as failed for OrderId={OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get delivery tracking information
    /// </summary>
    [HttpGet("{orderId}/track")]
    public async Task<ActionResult> GetDeliveryTracking(int orderId)
    {
        try
        {
            var tracking = await _deliveryService.GetDeliveryTrackingAsync(orderId);
            if (tracking == null)
            {
                return NotFound(new { message = "Delivery not found" });
            }

            return Ok(tracking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting delivery tracking");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Accept a delivery assignment (Rider)
    /// </summary>
    [HttpPost("{orderId}/accept")]
    public async Task<ActionResult> AcceptDelivery(int orderId, [FromBody] AcceptRejectRequest request)
    {
        if (orderId <= 0)
        {
            return BadRequest(new { message = "Invalid order ID" });
        }

        if (request == null || !request.RiderId.HasValue)
        {
            return BadRequest(new { message = "RiderId is required" });
        }

        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found for OrderId={OrderId}", orderId);
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.AcceptDeliveryAsync(delivery.DeliveryId, request.RiderId.Value);
            if (updatedDelivery == null)
            {
                return BadRequest(new { message = "Failed to accept delivery. It may not be assigned to you or is not in 'Assigned' status." });
            }

            _logger.LogInformation("Delivery accepted: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                updatedDelivery.DeliveryId, orderId, request.RiderId);
            
            return Ok(new { 
                deliveryId = updatedDelivery.DeliveryId,
                orderId = updatedDelivery.OrderId,
                riderId = updatedDelivery.RiderId,
                status = updatedDelivery.Status,
                message = "Delivery accepted successfully. Order status updated to 'In Progress'."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accepting delivery for OrderId={OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reject a delivery assignment (Rider)
    /// </summary>
    [HttpPost("{orderId}/reject")]
    public async Task<ActionResult> RejectDelivery(int orderId, [FromBody] AcceptRejectRequest request)
    {
        if (orderId <= 0)
        {
            return BadRequest(new { message = "Invalid order ID" });
        }

        if (request == null || !request.RiderId.HasValue)
        {
            return BadRequest(new { message = "RiderId is required" });
        }

        try
        {
            var delivery = await _deliveryService.GetDeliveryByOrderIdAsync(orderId);
            if (delivery == null)
            {
                _logger.LogWarning("Delivery not found for OrderId={OrderId}", orderId);
                return NotFound(new { message = "Delivery not found" });
            }

            var updatedDelivery = await _deliveryService.RejectDeliveryAsync(delivery.DeliveryId, request.RiderId.Value);
            if (updatedDelivery == null)
            {
                return BadRequest(new { message = "Failed to reject delivery. It may not be assigned to you or is not in 'Assigned' status." });
            }

            _logger.LogInformation("Delivery rejected: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                updatedDelivery.DeliveryId, orderId, request.RiderId);
            
            return Ok(new { 
                deliveryId = updatedDelivery.DeliveryId,
                orderId = updatedDelivery.OrderId,
                status = updatedDelivery.Status,
                riderId = updatedDelivery.RiderId,
                message = "Delivery rejected. Order is available for reassignment to another rider."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting delivery for OrderId={OrderId}", orderId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get all delivery history with order information (Admin only)
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult> GetAllDeliveryHistory([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var history = await _deliveryService.GetAllDeliveryHistoryAsync(startDate, endDate);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all delivery history");
            return StatusCode(500, new { message = "An error occurred while retrieving delivery history" });
        }
    }
}

/// <summary>
/// Request model for reassigning a delivery to a different rider.
/// </summary>
public class ReassignDeliveryRequest
{
    public int RiderId { get; set; }
}

/// <summary>
/// Request model for marking a delivery as failed.
/// </summary>
public class FailureRequest
{
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Request model for accepting or rejecting a delivery.
/// </summary>
public class AcceptRejectRequest
{
    public int? RiderId { get; set; }
}
