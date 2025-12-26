package com.delivery.service.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feedbackID; // Primary Key from ERD

    @ManyToOne
    @JoinColumn(name = "deliveryID")
    private Delivery delivery; // FK: Links to the specific delivery being rated

    @ManyToOne
    @JoinColumn(name = "riderID")
    private DeliveryRider rider; // FK: Links to the rider receiving the feedback

    private String feedback_comments; // The text review from the customer
    
    private Integer rating; // Usually a scale of 1-5

    private LocalDateTime timestamp; // When the feedback was submitted

    // Default Constructor
    public Feedback() {}

    // Getters and Setters
    public Long getFeedbackID() { return feedbackID; }
    public void setFeedbackID(Long feedbackID) { this.feedbackID = feedbackID; }

    public Delivery getDelivery() { return delivery; }
    public void setDelivery(Delivery delivery) { this.delivery = delivery; }

    public DeliveryRider getRider() { return rider; }
    public void setRider(DeliveryRider rider) { this.rider = rider; }

    public String getFeedback_comments() { return feedback_comments; }
    public void setFeedback_comments(String feedback_comments) { this.feedback_comments = feedback_comments; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}