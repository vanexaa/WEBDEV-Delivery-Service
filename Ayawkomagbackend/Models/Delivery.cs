using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models
{
    public class Delivery
    {
        [Key]
        public int DeliveryId { get; set; }

        [Required]
        public int OrderId { get; set; } // External Order ID

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, PickedUp, InTransit, Delivered, Failed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? EstimatedArrivalTime { get; set; }

        //Navigation properties 
        public int UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        // Rider relationship
        public int? RiderId { get; set; }
        [ForeignKey(nameof(RiderId))]
        public Rider? Rider { get; set; }

        public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();
        public ICollection<DeliveryFailure> DeliveryFailures { get; set; } = new List<DeliveryFailure>();
    }
}