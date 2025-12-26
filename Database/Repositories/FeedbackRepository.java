package com.delivery.service.repositories;

import com.delivery.service.entities.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    // Allows the rider to see all feedback left for them
    List<Feedback> findByRider_RiderID(Long riderID);
}