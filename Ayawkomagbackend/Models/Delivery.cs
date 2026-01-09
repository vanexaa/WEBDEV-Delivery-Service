using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class Delivery
    {
        [Key]
        public int DeliveryId { get; set; }

        [Required]
        public int OrderId { get; set; }

        public int? RiderId { get; set; }
        [ForeignKey(nameof(RiderId))]
        public Rider? Rider { get; set; }

        public int UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation collections
        public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();
        public ICollection<DeliveryFailure> DeliveryFailures { get; set; } = new List<DeliveryFailure>();
        public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
        public ICollection<DeliveryAssignment> Assignments { get; set; } = new List<DeliveryAssignment>();
    }
}
