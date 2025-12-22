using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class Feedback
    {
        [Key]
        public int FeedbackId { get; set; }

        public int DeliveryId { get; set; }
        [ForeignKey(nameof(DeliveryId))]
        public Delivery Delivery { get; set; } = null!;

        public int RiderId { get; set; }
        [ForeignKey(nameof(RiderId))]
        public Rider Rider { get; set; } = null!;

        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
