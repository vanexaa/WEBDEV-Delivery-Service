package com.delivery.service.repositories;

import com.delivery.service.entities.DeliveryRider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryRiderRepository extends JpaRepository<DeliveryRider, Long> {
}