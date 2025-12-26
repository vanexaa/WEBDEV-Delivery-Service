package com.delivery.service.services;

import com.delivery.service.entities.Delivery;
import com.delivery.service.repositories.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    // TASK: GET ETA (Task 2 requirement)
    public String getEstimatedArrivalTime(Long orderId) {
        Optional<Delivery> delivery = deliveryRepository.findByOrder_ID(orderId);
        
        if (delivery.isPresent()) {
            // "ETA Stub": Since real-time traffic is complex, we return a simulated time
            // as per your "Low Business Rules" requirement.
            return "25-35 minutes"; 
        }
        return "Order not found";
    }

    // TASK: Response Shaping & Status Updates
    public Delivery updateDeliveryStatus(Long orderId, String status, String reason) {
        Delivery delivery = deliveryRepository.findByOrder_ID(orderId)
            .orElseThrow(() -> new RuntimeException("Delivery not found"));

        delivery.setDelivery_Status(status);
        
        if ("Failed".equalsIgnoreCase(status)) {
            delivery.setReason_if_failed(reason);
        }

        return deliveryRepository.save(delivery);
    }
}