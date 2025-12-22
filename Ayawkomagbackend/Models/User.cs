using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ayawkomagbackend.Models 
{
    public class User
    {
        [Key]
        public int UserId { get; set; }  // Primary key

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = null!;  // User email

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = null!;  // Hashed password

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "User";  // Role (e.g., Admin, User)
    }
}