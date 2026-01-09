namespace Ayawkomagbackend.DTOs
{
    public class DeliveryDetailsDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int? RiderId { get; set; }
        public string? RiderName { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CustomerAddress { get; set; }
        public DateTime? Eta { get; set; }
    }
}
