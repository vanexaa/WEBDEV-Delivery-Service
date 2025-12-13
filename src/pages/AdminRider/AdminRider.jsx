import { useState } from "react";
import "./AdminRider.css"; // THIS LINE IS CRITICAL. DO NOT DELETE IT.
import kapebaralogo from "/src/assets/kapebara logo.png";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFailedReasonModal, setShowFailedReasonModal] = useState(false);
  const [failedReasons, setFailedReasons] = useState({
    customerUnavailable: false,
    wrongAddress: false,
    riderEmergency: false,
    weatherIssue: false,
    other: false,
  });
  const [otherReason, setOtherReason] = useState("");

  // Data for the riders
  const riders = [
    {
      id: 1,
      name: "Jane Doe",
      status: "Available",
      riderId: "000100101",
      phone: "0912-345-6789",
      email: "jane.doe@email.com",
      area: "North Caloocan",
      avgTime: "15 mins",
      vehicle: "Motorcycle",
      plate: "ABC 1234",
    },
    {
      id: 2,
      name: "Mam A. Mo",
      status: "Offline",
      riderId: "000100102",
      phone: "0998-765-4321",
      email: "mam.a.mo@email.com",
      area: "Quezon City",
      avgTime: "20 mins",
      vehicle: "Bicycle",
      plate: "N/A",
    },
  ];

  // Sample delivery data
  const deliveries = [
    {
      id: 1,
      orderId: "#12345",
      customerName: "John Smith",
      address: "Pantoc Mall",
      phone: "0917-123-4567",
      items: "2x Cappuccino, 1x Croissant",
      riderName: "Jane Doe",
      riderPhone: "0912-345-6789",
      status: "Ongoing",
      orderTime: "10:30 AM",
      eta: "11:00 AM",
      amount: "₱350.00",
    },
    {
      id: 2,
      orderId: "#12346",
      customerName: "Maria Garcia",
      address: "456 Del Pilar, Quezon City",
      phone: "0918-234-5678",
      items: "1x Iced Latte, 2x Blueberry Muffins",
      riderName: "Mam A. Mo",
      riderPhone: "0998-765-4321",
      status: "Preparing",
      orderTime: "10:45 AM",
      eta: "11:30 AM",
      amount: "₱420.00",
    },
    {
      id: 3,
      orderId: "#12347",
      customerName: "Pedro Santos",
      address: "789 Rizal Ave, North Caloocan",
      phone: "0919-345-6789",
      items: "3x Espresso, 1x Chocolate Cake",
      riderName: "Jane Doe",
      riderPhone: "0912-345-6789",
      status: "Delivered",
      orderTime: "9:15 AM",
      eta: "10:00 AM",
      amount: "₱275.00",
    },
    {
      id: 4,
      orderId: "#12348",
      customerName: "Ana Reyes",
      address: "321 Luna St, Quezon City",
      phone: "0920-456-7890",
      items: "1x Flat White, 1x Sandwich",
      riderName: "Unassigned",
      riderPhone: "N/A",
      status: "Pending",
      orderTime: "11:00 AM",
      eta: "11:45 AM",
      amount: "₱500.00",
    },
  ];

  // Function to get status color
  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "status-delivered";
      case "Ongoing":
        return "status-transit";
      case "Preparing":
        return "status-preparing";
      case "Pending":
        return "status-pending";
      default:
        return "";
    }
  };

  const handleCheckboxChange = (reason) => {
    setFailedReasons((prev) => ({
      ...prev,
      [reason]: !prev[reason],
    }));
  };

  const handleMarkAsDelivered = () => {
    alert(`Order ${selectedOrder.orderId} marked as delivered!`);
    setSelectedOrder(null);
  };

  const handleMarkAsFailed = () => {
    setShowFailedReasonModal(true);
  };

  const handleConfirmFailure = () => {
    const selectedReasons = Object.keys(failedReasons).filter(
      (key) => failedReasons[key]
    );
    const reasonsList = selectedReasons.map((reason) => {
      if (reason === "other" && otherReason) {
        return `Other: ${otherReason}`;
      }
      return reason;
    });
    alert(
      `Order ${selectedOrder.orderId} marked as failed. Reasons: ${reasonsList.join(
        ", "
      )}`
    );
    setShowFailedReasonModal(false);
    setSelectedOrder(null);
    setFailedReasons({
      customerUnavailable: false,
      wrongAddress: false,
      riderEmergency: false,
      weatherIssue: false,
      other: false,
    });
    setOtherReason("");
  };

  const handleCancelFailure = () => {
    setShowFailedReasonModal(false);
    setFailedReasons({
      customerUnavailable: false,
      wrongAddress: false,
      riderEmergency: false,
      weatherIssue: false,
      other: false,
    });
    setOtherReason("");
  };

  return (
    <div className="app">
      {/* === VIEW 1: DASHBOARD === */}
      {currentView === "dashboard" && (
        <>
          <img src={kapebaralogo} alt="Kapebara Logo" className="logo" />
          <div className="card">
            <h2 className="title">Admin Dashboard</h2>
            <div className="stats">
              <div className="stat">
                <div className="avatar"></div>
                <p>Total Riders: 30</p>
                <button onClick={() => setCurrentView("riders")}>
                  View Riders
                </button>
              </div>
              <div className="stat">
                <div className="avatar"></div>
                <p>Available Riders: 15</p>
                <button onClick={() => setCurrentView("deliveries")}>
                  View Deliveries
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === VIEW 2: RIDER LIST === */}
      {currentView === "riders" && (
        <div className="rider-container">
          <div className="back-btn" onClick={() => setCurrentView("dashboard")}>
            &laquo;
          </div>

          <div className="tabs">
            <span className="tab active">Rider's List</span>
            <span className="tab">On-Going deliveries</span>
          </div>

          <div className="list-card">
            <div className="list-header">
              <span>Rider name</span>
              <span>Availability</span>
            </div>

            <div className="riders-list">
              {riders.map((rider) => (
                <div key={rider.id} className="rider-row">
                  <div className="rider-info">
                    <div className="avatar-small">
                      {/* Icon */}
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#364152"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    {/* Click Name to Open Popup */}
                    <span
                      className="rider-name"
                      onClick={() => setSelectedRider(rider)}
                    >
                      {rider.name}
                    </span>
                  </div>

                  <div className="status-select">
                    <select defaultValue={rider.status}>
                      <option>Available</option>
                      <option>On Delivery</option>
                      <option>Break</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === VIEW 3: DELIVERY LIST === */}
      {currentView === "deliveries" && (
        <div className="rider-container">
          <div className="back-btn" onClick={() => setCurrentView("dashboard")}>
            &laquo;
          </div>

          <div className="tabs">
            <span className="tab">Rider's List</span>
            <span className="tab active">On-Going Deliveries</span>
          </div>

          <div className="list-card delivery-table-container">
            <h2 style={{ marginBottom: "20px", color: "#364152" }}>
              Delivery Management
            </h2>

            <div className="delivery-table-wrapper">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Rider Assigned</th>
                    <th>ETA</th>
                    <th>Status</th>
                    <th>View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className="order-id">{delivery.orderId}</td>
                      <td>{delivery.customerName}</td>
                      <td>{delivery.riderName}</td>
                      <td>{delivery.eta}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            delivery.status
                          )}`}
                        >
                          {delivery.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className="view-order-link"
                          onClick={() => setSelectedOrder(delivery)}
                        >
                          View Order
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* === RIDER POPUP MODAL === */}
      {selectedRider && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setSelectedRider(null)}
            >
              ✖
            </button>

            <div className="modal-header">
              <div className="avatar-large">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#364152">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h2>{selectedRider.name}</h2>
              <p className="rider-id">Rider ID: {selectedRider.riderId}</p>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h3>Contact Info:</h3>
                <p>- {selectedRider.phone}</p>
                <p>- {selectedRider.email}</p>
              </div>

              <div className="info-section">
                <h3>Work Info:</h3>
                <p>- Assigned Area: {selectedRider.area}</p>
                <p>- Delivery Time: {selectedRider.avgTime}</p>
              </div>

              <div className="info-section">
                <h3>Vehicle Info:</h3>
                <p>- Type: {selectedRider.vehicle}</p>
                <p>- Plate: {selectedRider.plate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === ORDER DETAILS POPUP MODAL === */}
      {selectedOrder && !showFailedReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content delivery-modal">
            <button
              className="close-btn"
              onClick={() => setSelectedOrder(null)}
            >
              ✖
            </button>

            <div className="modal-header">
              <h2>Delivery Details</h2>
              <div className="order-status-line">
                <span className="order-id-display">
                  Order ID: {selectedOrder.orderId}
                </span>
                <span
                  className={`status-badge ${getStatusClass(
                    selectedOrder.status
                  )}`}
                >
                  Status: {selectedOrder.status}
                </span>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h3>Customer Info:</h3>
                <p>- Name: {selectedOrder.customerName}</p>
                <p>- Contact Number: {selectedOrder.phone}</p>
                <p>- Delivery Address: {selectedOrder.address}</p>
              </div>

              <div className="info-section">
                <h3>Rider Info:</h3>
                <p>- Name: {selectedOrder.riderName}</p>
                <p>- Status: {selectedOrder.status}</p>
                <p>- Phone Number: {selectedOrder.riderPhone}</p>
              </div>

              <div className="info-section">
                <h3>Delivery Actions:</h3>
                <div className="action-buttons">
                  <button
                    className="action-btn delivered-btn"
                    onClick={handleMarkAsDelivered}
                  >
                    Mark as Delivered
                  </button>
                  <button
                    className="action-btn failed-btn"
                    onClick={handleMarkAsFailed}
                  >
                    Mark as Delivery Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === FAILED DELIVERY REASON MODAL === */}
      {showFailedReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content reason-modal">
            <button className="close-btn" onClick={handleCancelFailure}>
              ✖
            </button>

            <div className="modal-header">
              <h2>Reason for Failed Delivery</h2>
            </div>

            <div className="modal-body">
              <div className="checkbox-list">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={failedReasons.customerUnavailable}
                    onChange={() => handleCheckboxChange("customerUnavailable")}
                  />
                  <span>Customer unavailable</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={failedReasons.wrongAddress}
                    onChange={() => handleCheckboxChange("wrongAddress")}
                  />
                  <span>Wrong address</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={failedReasons.riderEmergency}
                    onChange={() => handleCheckboxChange("riderEmergency")}
                  />
                  <span>Rider emergency</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={failedReasons.weatherIssue}
                    onChange={() => handleCheckboxChange("weatherIssue")}
                  />
                  <span>Weather issue</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={failedReasons.other}
                    onChange={() => handleCheckboxChange("other")}
                  />
                  <span>Other</span>
                </label>

                {/* Text input appears when "Other" is checked */}
                {failedReasons.other && (
                  <div className="other-reason-input">
                    <input
                      type="text"
                      placeholder="Please specify the reason..."
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="reason-text-input"
                    />
                  </div>
                )}
              </div>

              <div className="reason-action-buttons">
                <button
                  className="reason-btn confirm-btn"
                  onClick={handleConfirmFailure}
                >
                  Confirm
                </button>
                <button
                  className="reason-btn cancel-btn"
                  onClick={handleCancelFailure}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;