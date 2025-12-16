import React from "react";
import "../css/Customer.css";
import etaImage from "../assets/capy.png";

export default function Customer({ rider, eta, orders }) {
  const defaultRider = {
    name: "Juan Dela Cruz",
    phone: "09XX XXX XXXX",
    vehicleType: "Motorcycle",
    plateNumber: "ABC-1234",
    paymentMethod: "COD",
    profilePicture: "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
  };

  const defaultOrders = [
    { name: "Barako", quantity: 1 },
    { name: "Latte", quantity: 2 },
    { name: "Americano", quantity: 1 },
    { name: "Cappuccino", quantity: 3 },
    { name: "Mocha", quantity: 1 }
  ];

  const riderData = rider || defaultRider;
  const etaData = eta || "20 minutes";
  const ordersData = orders || defaultOrders;

  return (
    <div className="customer-page">
      <div className="customer-container">
       
        <div className="left-section">
          <img
            className="rider-profile"
            src={riderData.profilePicture}
            alt="Rider profile"
          />

          <div className="info-list">
            {[
              ["Rider Name", riderData.name],
              ["Phone Number", riderData.phone],
              ["Vehicle Type", riderData.vehicleType],
              ["Plate Number", riderData.plateNumber],
              ["Payment Method", riderData.paymentMethod]
            ].map(([label, value], idx) => (
              <div className="info-item" key={idx}>
                <span className="info-label">{label}:</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        
        <div className="right-section">
          <div className="eta-box">
            <img src={etaImage} alt="ETA" className="eta-img" />
            <div className="eta-text">
              <p className="eta-title">Estimated Time of Arrival:</p>
              <p className="eta-time">{etaData}</p>
            </div>
          </div>

          <div className="order-summary-container">
            <p className="order-title">📄 Order Summary:</p>
            <div className="order-scroll">
              {ordersData.map((order, index) => (
                <p key={index}>
                  <span className="order-quantity">{order.quantity}x</span> {order.name}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
