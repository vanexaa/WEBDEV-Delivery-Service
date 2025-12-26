package com.delivery.service.controllers;

import com.delivery.service.entities.DeliveryRider;
import com.delivery.service.services.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private DeliveryService deliveryService;

    // TEST ENDPOINT 1: GET ETA
    // URL: http://localhost:8080/api/customers/123/eta
    @GetMapping("/{orderId}/eta")
    public ResponseEntity<String> getEta(@PathVariable Long orderId) {
        String eta = deliveryService.getEstimatedArrivalTime(orderId);
        return ResponseEntity.ok(eta);
    }

    // TEST ENDPOINT 2: GET RIDER DETAILS
    // URL: http://localhost:8080/api/customers/123/rider
    @GetMapping("/{orderId}/rider")
    public ResponseEntity<Object> getRider(@PathVariable Long orderId) {
        // This uses the "Response Shaping" logic to return rider info
        return ResponseEntity.ok(deliveryService.getRiderInfo(orderId));
    }
}