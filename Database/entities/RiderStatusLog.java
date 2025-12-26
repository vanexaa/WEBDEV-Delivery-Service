package com.delivery.service.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rider_status_log")
public class RiderStatusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long status_logID; // Primary Key from ERD

    @ManyToOne
    @JoinColumn(name = "riderID")
    private DeliveryRider rider; // FK: Links to the rider being tracked

    private Double latitude; // To store GPS coordinates
    private Double longitude; // To store GPS coordinates

    private LocalDateTime timestamp; // When the location was recorded

    /**
     * Represents the rider's current state (e.g., "Online", "Offline", "In-Transit").
     * Supports availability and status requirements.
     */
    private String riderStatus; 

    // Default Constructor
    public RiderStatusLog() {}

    // Getters and Setters
    public Long getStatus_logID() { return status_logID; }
    public void setStatus_logID(Long status_logID) { this.status_logID = status_logID; }

    public DeliveryRider getRider() { return rider; }
    public void setRider(DeliveryRider rider) { this.rider = rider; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getRiderStatus() { return riderStatus; }
    public void setRiderStatus(String riderStatus) { this.riderStatus = riderStatus; }
}