namespace CustomerService.Models.DTOs;

public class RiderInfoDto
{
    public int RiderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
}
