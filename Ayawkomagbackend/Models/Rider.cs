using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class Rider
    {
        [Key]
        public int RiderId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string PhoneNumber { get; set; } = string.Empty;

        // Vehicle information
        [MaxLength(50)]
        public string? VehicleType { get; set; } // e.g., "Motorcycle", "Bicycle", "Car"

        // Capacity (max deliveries a rider can handle)
        public int Capacity { get; set; } = 5;

        // Availability status
        public bool IsAvailable { get; set; } = true;

        // Blocked until (for temporary blocking/suspension)
        public DateTime? BlockedUntil { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation collections
        public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
        public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
        public ICollection<DeliveryAssignment> Assignments { get; set; } = new List<DeliveryAssignment>();
    }
}
