package com.delivery.service.entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "delivery_rider")
public class DeliveryRider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long riderID; // Primary Key from ERD

    private String rider_name;
    private String rider_email;
    private String rider_contactNo;
    private String rider_password;
    private String rider_licenseNo;

    /**
     * Supports "Rider availability management" requirement.
     * Values typically: "online", "offline".
     */
    private String availabilityStatus; 

    // Relationship to Vehicle based on ERD FK
    @ManyToOne
    @JoinColumn(name = "vehicleID")
    private Vehicle vehicle;

    // One rider can have many deliveries
    @OneToMany(mappedBy = "rider")
    private List<Delivery> deliveries;

    // Default Constructor
    public DeliveryRider() {}

    // Getters and Setters
    public Long getRiderID() { return riderID; }
    public void setRiderID(Long riderID) { this.riderID = riderID; }

    public String getRider_name() { return rider_name; }
    public void setRider_name(String rider_name) { this.rider_name = rider_name; }

    public String getRider_email() { return rider_email; }
    public void setRider_email(String rider_email) { this.rider_email = rider_email; }

    public String getRider_contactNo() { return rider_contactNo; }
    public void setRider_contactNo(String rider_contactNo) { this.rider_contactNo = rider_contactNo; }

    public String getRider_password() { return rider_password; }
    public void setRider_password(String rider_password) { this.rider_password = rider_password; }

    public String getRider_licenseNo() { return rider_licenseNo; }
    public void setRider_licenseNo(String rider_licenseNo) { this.rider_licenseNo = rider_licenseNo; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
}