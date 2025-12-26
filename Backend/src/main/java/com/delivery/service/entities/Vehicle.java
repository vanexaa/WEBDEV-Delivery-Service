package com.delivery.service.entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "vehicle")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vehicleID; // Primary Key from ERD

    private String vehicleName; //
    private String vehicleDesc; //
    private String vehicleModel; //
    private String vehicleType; //
    private String plateNo; //

    // One vehicle can be associated with many riders over time
    @OneToMany(mappedBy = "vehicle")
    private List<DeliveryRider> riders;

    // Default Constructor
    public Vehicle() {}

    // Getters and Setters
    public Long getVehicleID() { return vehicleID; }
    public void setVehicleID(Long vehicleID) { this.vehicleID = vehicleID; }

    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }

    public String getVehicleDesc() { return vehicleDesc; }
    public void setVehicleDesc(String vehicleDesc) { this.vehicleDesc = vehicleDesc; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getPlateNo() { return plateNo; }
    public void setPlateNo(String plateNo) { this.plateNo = plateNo; }
}