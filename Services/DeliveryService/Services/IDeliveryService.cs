using DeliveryService.Models;
using DeliveryService.Models.DTOs;

namespace DeliveryService.Services;

public interface IDeliveryService
{
    Task<Delivery?> AssignDeliveryAsync(AssignDeliveryRequest request);
    Task<Delivery?> GetDeliveryByOrderIdAsync(int orderId);
    Task<Delivery?> GetDeliveryByIdAsync(int deliveryId);
    Task<List<Delivery>> GetActiveDeliveriesAsync();
    Task<Delivery?> UpdateDeliveryStatusAsync(int deliveryId, UpdateDeliveryStatusRequest request, int userId);
    Task<Delivery?> MarkDeliveryAsFailedAsync(int deliveryId, string failureReason, int userId);
    Task<Delivery?> ReassignDeliveryAsync(int deliveryId, int newRiderId);
    Task<DeliveryTrackingDto?> GetDeliveryTrackingAsync(int orderId);
}
