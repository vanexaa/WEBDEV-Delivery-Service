namespace Ayawkomagbackend.DTOs
{
    public class RiderLoadDto
    {
        public int RiderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? VehicleType { get; set; }
        public int Capacity { get; set; }
        public string AvailabilityStatus { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public int CurrentLoad { get; set; } // Number of active deliveries
        public double RatingAvg { get; set; }
        public DateTime? BlockedUntil { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public double LoadPercentage { get; set; } // CurrentLoad / Capacity * 100
    }
}

