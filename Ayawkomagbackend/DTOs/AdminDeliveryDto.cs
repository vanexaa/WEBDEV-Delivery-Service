namespace Ayawkomagbackend.DTOs
{
    public class AdminDeliveryDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? RiderName { get; set; }
        public int? RiderId { get; set; }
        public string? RiderPhone { get; set; }
        public DateTime? Eta { get; set; }
    }
}

