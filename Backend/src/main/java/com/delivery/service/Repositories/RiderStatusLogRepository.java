package com.delivery.service.repositories;

import com.delivery.service.entities.RiderStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RiderStatusLogRepository extends JpaRepository<RiderStatusLog, Long> {
    // Gets the latest logs for a specific rider to show their movement
    List<RiderStatusLog> findByRider_RiderIDOrderByTimestampDesc(Long riderID);
}