package com.delivery.service.repositories;

import com.delivery.service.entities.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    // You can add a custom query to find a vehicle by plate number if needed
    java.util.Optional<Vehicle> findByPlateNo(String plateNo);
}