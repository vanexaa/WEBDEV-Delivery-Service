package com.delivery.service.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_history")
public class DeliveryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long history_logID; // Primary Key from ERD

    @ManyToOne
    @JoinColumn(name = "deliveryID")
    private Delivery delivery; // FK: Links to the specific delivery record

    @ManyToOne
    @JoinColumn(name = "vehicleID")
    private Vehicle vehicle; // FK: Records which vehicle was used for this trip

    @ManyToOne
    @JoinColumn(name = "riderID")
    private DeliveryRider rider; // FK: Links to the rider who performed the delivery

    private LocalDateTime historyDate; // Date and time of the entry
    
    private String historyStatus; // Status at the time of logging (e.g., Delivered)
    
    private String historyNotes; // Any specific notes regarding the delivery
    
    private String proof_of_delivery; // URL or reference to proof (image/signature)

    // Default Constructor
    public DeliveryHistory() {}

    // Getters and Setters
    public Long getHistory_logID() { return history_logID; }
    public void setHistory_logID(Long history_logID) { this.history_logID = history_logID; }

    public Delivery getDelivery() { return delivery; }
    public void setDelivery(Delivery delivery) { this.delivery = delivery; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public DeliveryRider getRider() { return rider; }
    public void setRider(DeliveryRider rider) { this.rider = rider; }

    public LocalDateTime getHistoryDate() { return historyDate; }
    public void setHistoryDate(LocalDateTime historyDate) { this.historyDate = historyDate; }

    public String getHistoryStatus() { return historyStatus; }
    public void setHistoryStatus(String historyStatus) { this.historyStatus = historyStatus; }

    public String getHistoryNotes() { return historyNotes; }
    public void setHistoryNotes(String historyNotes) { this.historyNotes = historyNotes; }

    public String getProof_of_delivery() { return proof_of_delivery; }
    public void setProof_of_delivery(String proof_of_delivery) { this.proof_of_delivery = proof_of_delivery; }
}