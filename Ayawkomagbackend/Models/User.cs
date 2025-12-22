using System.ComponentModel.DataAnnotations;

namespace Ayawkomagbackend.Models 
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "User"; // e.g., Admin, User, Rider_User
        

        public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();

    }
}