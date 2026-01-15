namespace RiderService.Models;

public class RiderAvailability
{
    public int AvailabilityId { get; set; }
    public int RiderId { get; set; }
    public bool IsOnline { get; set; } = false;
    public decimal? CurrentLatitude { get; set; }
    public decimal? CurrentLongitude { get; set; }
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Rider? Rider { get; set; }
}
