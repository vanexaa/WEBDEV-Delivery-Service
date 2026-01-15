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
            var delivery = await _deliveryService.AssignDeliveryAsync(request);
            if (delivery == null)
            {
                _logger.LogWarning("Order not found for assignment: OrderId={OrderId}", request.OrderId);
                return NotFound(new { message = "Order not found" });
            }

            _logger.LogInformation("Delivery assigned successfully: DeliveryId={DeliveryId}, OrderId={OrderId}, RiderId={RiderId}",
                delivery.DeliveryId, delivery.OrderId, delivery.RiderId);
            return Ok(delivery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning delivery for OrderId={OrderId}", request.OrderId);
            return StatusCode(500, new { message = "An error occurred" });
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
