package com.delivery.service.repositories;

import com.delivery.service.entities.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    // This allows you to find deliveries by order ID for your GET /eta endpoint
    java.util.Optional<Delivery> findByOrder_ID(Long orderID);
}