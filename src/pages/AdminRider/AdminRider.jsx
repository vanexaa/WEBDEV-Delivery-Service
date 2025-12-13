import { useState } from "react";
import "./AdminRider.css"; // THIS LINE IS CRITICAL. DO NOT DELETE IT.

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedRider, setSelectedRider] = useState(null);

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
      plate: "ABC 1234"
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
      plate: "N/A"
    },
  ];

  return (
    <div className="app">
      
      {/* === VIEW 1: DASHBOARD === */}
      {currentView === "dashboard" && (
        <>

          <img src={logoImage} alt="Kapebara Logo" className="logo" />
          <div className="card">
            <h2 className="title">Admin Dashboard</h2>
            <div className="stats">
              <div className="stat">
                <div className="avatar"></div>
                <p>Total Riders: 30</p>
                <button onClick={() => setCurrentView("riders")}>View Riders</button>
              </div>
              <div className="stat">
                <div className="avatar"></div>
                <p>Available Riders: 15</p>
                <button>View Deliveries</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === VIEW 2: RIDER LIST === */}
      {currentView === "riders" && (
        <div className="rider-container">
          <div className="back-btn" onClick={() => setCurrentView("dashboard")}>&laquo;</div>

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
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="#364152"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    {/* Click Name to Open Popup */}
                    <span className="rider-name" onClick={() => setSelectedRider(rider)}>
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

      {/* === POPUP MODAL === */}
      {selectedRider && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedRider(null)}>✖</button>

            <div className="modal-header">
              <div className="avatar-large">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="#364152"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
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

    </div>
  );
}

export default App;
