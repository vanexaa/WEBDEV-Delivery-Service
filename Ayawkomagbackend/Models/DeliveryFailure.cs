using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class DeliveryFailure
    {
        [Key]
        public int FailureId { get; set; }

        public int DeliveryId { get; set; }

        // Optional navigation
        [ForeignKey(nameof(DeliveryId))]
        public Delivery? Delivery { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        //Navigation
        public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();

    }
}
