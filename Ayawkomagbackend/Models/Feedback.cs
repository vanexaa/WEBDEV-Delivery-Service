using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class Feedback
    {
        [Key]
        public int FeedbackId { get; set; }

        // Foreign key to Delivery
        public int DeliveryId { get; set; }

        [ForeignKey(nameof(DeliveryId))]
        public Delivery Delivery { get; set; } = null!;

        // Foreign key to Rider
        public int RiderId { get; set; }

        [ForeignKey(nameof(RiderId))]
        public Rider Rider { get; set; } = null!;

        // Rating 1-5
        [Range(1, 5)]
        public int Rating { get; set; }

        // Optional comment
        [MaxLength(1000)]
        public string? Comment { get; set; }

        // Timestamp for when feedback was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
