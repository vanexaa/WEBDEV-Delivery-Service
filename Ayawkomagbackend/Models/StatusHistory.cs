using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class StatusHistory
    {
        [Key]
        public int HistoryId { get; set; }

        public int DeliveryId { get; set; }
        [ForeignKey(nameof(DeliveryId))]
        public Delivery Delivery { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? ChangedBy { get; set; }
    }
}
