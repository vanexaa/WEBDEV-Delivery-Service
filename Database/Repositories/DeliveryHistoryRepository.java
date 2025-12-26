package com.delivery.service.repositories;

import com.delivery.service.entities.DeliveryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeliveryHistoryRepository extends JpaRepository<DeliveryHistory, Long> {
    // Retrieves the full history for a specific rider
    List<DeliveryHistory> findByRider_RiderID(Long riderID);
}