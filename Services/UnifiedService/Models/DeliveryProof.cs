namespace DeliveryService.Models;

public class DeliveryProof
{
    public int ProofId { get; set; }
    public int DeliveryId { get; set; }
    public string? PhotoUrl { get; set; }
    public string? OTP { get; set; }
    public string? SignatureUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Delivery? Delivery { get; set; }
}
