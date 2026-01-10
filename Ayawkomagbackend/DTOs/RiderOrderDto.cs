namespace Ayawkomagbackend.DTOs
{
    public class RiderOrderDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public DateTime? Eta { get; set; }
    }
}