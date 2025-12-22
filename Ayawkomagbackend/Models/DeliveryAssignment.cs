using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class DeliveryAssignment
    {
        [Key]
        public int AssignmentId { get; set; }

        public int DeliveryId { get; set; }
        [ForeignKey(nameof(DeliveryId))]
        public Delivery Delivery { get; set; } = null!;

        public int RiderId { get; set; }
        [ForeignKey(nameof(RiderId))]
        public Rider Rider { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}
