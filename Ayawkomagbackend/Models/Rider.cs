using System.ComponentModel.DataAnnotations;

namespace Ayawkomagbackend.Models
{
    public class Rider
    {
        [Key]
        public int RiderId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public bool IsAvailable { get; set; } = true;

    }
}