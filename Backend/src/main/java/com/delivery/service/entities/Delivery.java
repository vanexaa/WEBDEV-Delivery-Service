package com.delivery.service.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long deliveryID; // Primary Key from ERD

    @Column(name = "order_id")
    private Long orderId; // FK: Link to the specific order

    @Column(name = "customer_id")
    private Long customer_ID; // FK: Link to the customer receiving the order

    @Column(name = "payment_id")
    private Long payment_ID; // FK: Link to payment details

    private LocalDateTime delivery_Start; // Time when delivery began
    private LocalDateTime delivery_End; // Time when delivery was completed or failed

    private String delivery_From; // Pickup location/address
    private String delivery_To; // Destination customer address

    /**
     * Possible statuses: "Picked-Up", "In-Transit", "Delivered", "Failed"
     */
    private String delivery_Status; 

    @Column(name = "reason_if_failed")
    private String reason_if_failed; // Reason if the rider marks it as "unable to deliver"

    // Foreign Key Relationships based on ERD
    @ManyToOne
    @JoinColumn(name = "riderID")
    private DeliveryRider rider; // The rider assigned to this delivery

    @Column(name = "adminID")
    private Long adminID; // The admin who might monitor or reassign this delivery

    // Default Constructor
    public Delivery() {}

    // Getters and Setters
    public Long getDeliveryID() { return deliveryID; }
    public void setDeliveryID(Long deliveryID) { this.deliveryID = deliveryID; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getCustomer_ID() { return customer_ID; }
    public void setCustomer_ID(Long customer_ID) { this.customer_ID = customer_ID; }

    public String getDelivery_Status() { return delivery_Status; }
    public void setDelivery_Status(String delivery_Status) { this.delivery_Status = delivery_Status; }

    public String getReason_if_failed() { return reason_if_failed; }
    public void setReason_if_failed(String reason_if_failed) { this.reason_if_failed = reason_if_failed; }

    public DeliveryRider getRider() { return rider; }
    public void setRider(DeliveryRider rider) { this.rider = rider; }

    // (Note: Add remaining getters and setters for all fields as needed)
}