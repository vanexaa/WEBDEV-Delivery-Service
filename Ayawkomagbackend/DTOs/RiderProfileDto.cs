namespace Ayawkomagbackend.DTOs
{
    public class RiderProfileDto
    {
        public int RiderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
    }
}
