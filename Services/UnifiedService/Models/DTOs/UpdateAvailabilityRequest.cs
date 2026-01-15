namespace RiderService.Models.DTOs;

public class UpdateAvailabilityRequest
{
    public bool IsOnline { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
