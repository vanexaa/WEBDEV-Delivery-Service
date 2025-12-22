using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class DeliveryAssignment
    {
        [Key]
        public int AssignmentId { get; set; }

        // Foreign key to Delivery
        public int DeliveryId { get; set; }
        [ForeignKey(nameof(DeliveryId))]
        public Delivery Delivery { get; set; } = null!;

        // Foreign key to Rider
        public int RiderId { get; set; }
        [ForeignKey(nameof(RiderId))]
        public Rider Rider { get; set; } = null!;

        // Timestamp when assignment was created
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Optional: whether this assignment is currently active
        public bool IsActive { get; set; } = true;
    }
}
