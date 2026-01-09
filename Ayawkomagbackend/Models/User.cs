using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Ayawkomagbackend.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        // Navigation collection
        public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
    }
}
