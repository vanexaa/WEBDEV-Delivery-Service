namespace Ayawkomagbackend.DTOs
{
    public class RiderHistoryOrderDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime DeliveredAt { get; set; }
        public string? CustomerName { get; set; }
        public int? Rating { get; set; }
        public string? Feedback { get; set; }
    }
}
