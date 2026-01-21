/*
 * UnifiedService Architecture - Delivery Service Interface
 * 
 * Part of UnifiedService on port 5000.
 * Defines delivery service contract.
 */
using DeliveryService.Models;
using DeliveryService.Models.DTOs;
using System.Collections.Generic;

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
    Task<List<Delivery>> GetAvailableDeliveriesAsync(int? riderId = null);
    Task<List<DeliveryWithOrderDto>> GetActiveDeliveriesWithOrdersAsync();
    Task<List<DeliveryWithOrderDto>> GetAllDeliveryHistoryAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<Delivery?> AcceptDeliveryAsync(int deliveryId, int riderId);
    Task<Delivery?> RejectDeliveryAsync(int deliveryId, int riderId);
}
