package com.delivery.service.services;

import com.delivery.service.repositories.DeliveryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    // Requirement: ETA Stub
    public String getEstimatedArrivalTime(Long orderId) {
        return "25-35 minutes"; 
    }

    // Requirement: Response Shaping
    public Map<String, Object> getRiderInfo(Long orderId) {
        Map<String, Object> riderInfo = new HashMap<>();
        riderInfo.put("riderName", "John Doe");
        riderInfo.put("phoneNumber", "0912-345-6789");
        riderInfo.put("vehicleType", "Motorcycle");
        riderInfo.put("rating", 4.8);
        return riderInfo;
    }
}