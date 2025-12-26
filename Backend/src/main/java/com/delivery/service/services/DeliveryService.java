package com.delivery.service.services;

import com.delivery.service.entities.Delivery;
import com.delivery.service.repositories.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    // TASK: GET ETA (Task 2 requirement)
    public String getEstimatedArrivalTime(Long orderId) {
        // We use a stub response as per "Low Business Rules" requirement
        return "25-35 minutes"; 
    }

    // NEW METHOD FOR TASK 2: Response Shaping
    public Map<String, Object> getRiderInfo(Long orderId) {
        // This shapes the response to only show public rider details
        Map<String, Object> riderInfo = new HashMap<>();
        riderInfo.put("riderName", "John Doe");
        riderInfo.put("phoneNumber", "0912-345-6789");
        riderInfo.put("vehicleType", "Motorcycle");
        riderInfo.put("rating", 4.8);
        return riderInfo;
    }

    // TASK: Status Updates (Task 3 Preparation)
    public Delivery updateDeliveryStatus(Long orderId, String status, String reason) {
        // Note: Using findById or custom query depending on your Repository setup
        Delivery delivery = deliveryRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Delivery not found"));

        delivery.setDelivery_Status(status);
        
        if ("Failed".equalsIgnoreCase(status)) {
            delivery.setReason_if_failed(reason);
        }

        return deliveryRepository.save(delivery);
    }
}