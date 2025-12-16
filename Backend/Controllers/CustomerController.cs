using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    // Sets the base route for all methods in this controller
    [Route("api/customers")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        // Dependency Injection of the database context
        private readonly DeliveryContext _context;

        public CustomerController(DeliveryContext context)
        {
            _context = context;
        }

        // 1. GET /api/customers/{orderId}/rider - View rider details for contact
        // Requirement: see delivery personnel details for contact. [cite: 10]
        [HttpGet("{orderId}/rider")]
        public async Task<ActionResult<object>> GetRiderDetails(int orderId)
        {
            // Find delivery by OrderId
            var delivery = await _context.Deliveries
                .FirstOrDefaultAsync(d => d.OrderId == orderId);

            if (delivery == null)
            {
                return NotFound($"Delivery for Order ID {orderId} not found.");
            }

            // Returns simulated rider data
            return new 
            {
                riderName = "Juan Dela Cruz",
                riderContact = "0917-123-4567",
                riderId = delivery.RiderId 
            };
        }
        
        // 2. GET /api/customers/{orderId}/eta - View estimated arrival time
        [HttpGet("{orderId}/eta")]
        public async Task<ActionResult<object>> GetEstimatedTimeOfArrival(int orderId)
        {
            var delivery = await _context.Deliveries
                .FirstOrDefaultAsync(d => d.OrderId == orderId);

            if (delivery == null)
            {
                return NotFound($"Delivery for Order ID {orderId} not found.");
            }

            return new
            {
                estimatedTime = delivery.EstimatedTimeOfArrival.ToString("hh:mm tt"),
                status = delivery.Status,
                simulatedMapLink = "https://maps.simulated.link/" 
            };
        }

        // 3. POST /api/customers/{orderId}/feedback - Submit rider rating & feedback
        [HttpPost("{orderId}/feedback")]
        public async Task<ActionResult> SubmitFeedback(int orderId, [FromBody] FeedbackDto feedback)
        {
            var delivery = await _context.Deliveries
                .FirstOrDefaultAsync(d => d.OrderId == orderId);
            
            if (delivery == null)
            {
                return NotFound($"Delivery for Order ID {orderId} not found.");
            }

            // Update the model with feedback details
            delivery.CustomerRating = feedback.Rating;
            delivery.CustomerFeedback = feedback.Comments;

            // Save changes to the database
            await _context.SaveChangesAsync();
            
            // Return 204 No Content for a successful update.
            return NoContent();
        }

        // Data Transfer Object (DTO) for incoming feedback data
        public class FeedbackDto
        {
            public int Rating { get; set; } // e.g., 1 to 5
            public string? Comments { get; set; }
        }
    }
}