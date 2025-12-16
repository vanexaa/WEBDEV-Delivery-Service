using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    // This model handles the core data points required by your delivery service endpoints.
    public class Delivery
    {
        // Primary Key for the Database
        [Key]
        public int Id { get; set; }

        // Core Identifiers (Order ID and Assigned Rider ID are crucial for your endpoints)
        public int OrderId { get; set; }     // Maps to {orderId} in endpoint URLs
        public int RiderId { get; set; }     // Assigned rider (Required for assignment/tracking)
        public int CustomerId { get; set; }  // For customer lookup/feedback

        // Status and Tracking (Required by Status & ETA endpoints)
        public string Status { get; set; } = "Pending"; // E.g., Picked-Up, In-Transit, Delivered, Failed
        public DateTime EstimatedTimeOfArrival { get; set; } = DateTime.Now.AddHours(1); // Set a default ETA
        public string CurrentLocationSimulation { get; set; } = "Cafe"; // Simulated location (Business Rule)
        
        // Failure/Feedback Details
        public string? ReasonIfFailed { get; set; } // Used for PUT /failure endpoint
        public string? CustomerFeedback { get; set; } 
        public int? CustomerRating { get; set; } // Used for POST /feedback endpoint (e.g., 1 to 5)
    }
}