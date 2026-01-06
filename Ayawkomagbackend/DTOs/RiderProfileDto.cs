namespace Ayawkomagbackend.DTOs
{
    public class RiderProfileDto
    {
        public int RiderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public int CurrentLoad { get; set; } // Number of active deliveries
        public int MaxLoad { get; set; } = 5; // Maximum deliveries a rider can handle
        public double LoadPercentage { get; set; } // CurrentLoad / MaxLoad * 100
        public bool CanAcceptMore { get; set; } // IsAvailable && CurrentLoad < MaxLoad
    }
}
