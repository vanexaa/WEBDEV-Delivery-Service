import { useState, useEffect } from "react";
import "../css/AdminRider.css";
import kapebaralogo from "/src/assets/kapebara logo.png";

const API_BASE_URL = 'http://localhost:5292';

function AdminRider() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFailedReasonModal, setShowFailedReasonModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [failedReasons, setFailedReasons] = useState({
    customerUnavailable: false,
    wrongAddress: false,
    riderEmergency: false,
    weatherIssue: false,
    other: false,
  });
  const [otherReason, setOtherReason] = useState("");
  
  // API data states
  const [riders, setRiders] = useState([]);
  const [allRiders, setAllRiders] = useState([]); // For reassignment dropdown
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all deliveries
  const fetchDeliveries = async (status = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = status && status !== "All" 
        ? `${API_BASE_URL}/api/admin/deliveries?status=${status}`
        : `${API_BASE_URL}/api/admin/deliveries`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          setDeliveries([]);
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      // Check if it's a network error (backend not running)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
      console.error('Error fetching deliveries:', err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all riders with load information
  const fetchRiders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/riders/load`);
      if (!response.ok) {
        if (response.status === 404) {
          setRiders([]);
          setAllRiders([]);
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      // Transform API data to match component structure
      const transformedRiders = data.map((r, index) => ({
        id: r.riderId,
        name: r.name,
        status: r.isAvailable ? "Available" : "Offline",
        riderId: r.riderId.toString().padStart(9, '0'),
        phone: r.phoneNumber,
        email: r.email,
        area: "N/A", // Not in current model
        avgTime: "N/A", // Not in current model
        vehicle: "N/A", // Not in current model
        plate: "N/A", // Not in current model
        isAvailable: r.isAvailable,
        currentLoad: r.currentLoad,
        maxLoad: r.maxLoad,
        loadPercentage: r.loadPercentage
      }));
      setRiders(transformedRiders);
      // Keep original for reassignment (without load for dropdown)
      const ridersForReassign = await fetch(`${API_BASE_URL}/api/admin/riders`).then(r => r.json()).catch(() => []);
      setAllRiders(ridersForReassign);
    } catch (err) {
      // Check if it's a network error (backend not running)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
      console.error('Error fetching riders:', err);
      setRiders([]);
      setAllRiders([]);
    }
  };

  // Fetch delivery details
  const fetchDeliveryDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/deliveries/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch delivery details');
      return await response.json();
    } catch (err) {
      console.error('Error fetching delivery details:', err);
      return null;
    }
  };

  // Load data on component mount and when view changes
  useEffect(() => {
    if (currentView === "deliveries") {
      fetchDeliveries(statusFilter);
    } else if (currentView === "riders") {
      fetchRiders();
    }
  }, [currentView, statusFilter]);

  // Sample delivery data (fallback)
  const mockDeliveries = [
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
      case "InTransit":
      case "Ongoing":
        return "status-transit";
      case "PickedUp":
        return "status-preparing";
      case "Assigned":
      case "Preparing":
      case "Pending":
        return "status-pending";
      case "Failed":
        return "status-failed";
      default:
        return "";
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusMap = {
      "Assigned": "Assigned",
      "PickedUp": "Picked Up",
      "InTransit": "In Transit",
      "Delivered": "Delivered",
      "Failed": "Failed",
      "Pending": "Pending"
    };
    return statusMap[status] || status;
  };

  const handleCheckboxChange = (reason) => {
    setFailedReasons((prev) => ({
      ...prev,
      [reason]: !prev[reason],
    }));
  };

  // Mark delivery as delivered
  const handleMarkAsDelivered = async () => {
    if (!selectedOrder) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/deliveries/${selectedOrder.orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered' })
      });
      if (!response.ok) throw new Error('Failed to mark as delivered');
      await fetchDeliveries(statusFilter);
      setSelectedOrder(null);
      alert(`Order #${selectedOrder.orderId} marked as delivered!`);
    } catch (err) {
      alert('Failed to mark as delivered: ' + err.message);
    }
  };

  // Open failed reason modal
  const handleMarkAsFailed = () => {
    setShowFailedReasonModal(true);
  };

  // Confirm failure with reasons
  const handleConfirmFailure = async () => {
    if (!selectedOrder) return;
    
    const selectedReasons = Object.keys(failedReasons).filter(
      (key) => failedReasons[key]
    );
    
    if (selectedReasons.length === 0) {
      alert('Please select at least one reason for failure.');
      return;
    }
    
    const reasonsList = selectedReasons.map((reason) => {
      if (reason === "other" && otherReason) {
        return `Other: ${otherReason}`;
      }
      // Format reason text
      return reason.charAt(0).toUpperCase() + reason.slice(1).replace(/([A-Z])/g, ' $1').trim();
    });
    
    const failureReason = reasonsList.join(", ");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/deliveries/${selectedOrder.orderId}/failure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: failureReason })
      });
      if (!response.ok) throw new Error('Failed to mark as failed');
      await fetchDeliveries(statusFilter);
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
      alert(`Order #${selectedOrder.orderId} marked as failed.`);
    } catch (err) {
      alert('Failed to mark as failed: ' + err.message);
    }
  };

  // Reassign rider
  const handleReassignRider = async (newRiderId) => {
    if (!selectedOrder) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/deliveries/${selectedOrder.orderId}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRiderId: newRiderId })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to reassign rider');
      }
      await fetchDeliveries(statusFilter);
      await fetchRiders(); // Refresh rider load
      setShowReassignModal(false);
      setSelectedOrder(null);
      alert(`Rider reassigned successfully!`);
    } catch (err) {
      alert('Failed to reassign rider: ' + err.message);
    }
  };

  // Auto-assign delivery to least loaded rider
  const handleAutoAssign = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deliveries/auto-assign?orderId=${orderId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to auto-assign rider');
      }
      const data = await response.json();
      await fetchDeliveries(statusFilter);
      await fetchRiders(); // Refresh rider load
      alert(`Delivery auto-assigned to ${data.riderName} (New Load: ${data.currentLoad})`);
    } catch (err) {
      alert('Failed to auto-assign: ' + err.message);
    }
  };

  // Handle view order click
  const handleViewOrder = async (delivery) => {
    const details = await fetchDeliveryDetails(delivery.orderId);
    if (details) {
      setSelectedOrder({
        ...delivery,
        ...details,
        customerName: details.customer?.name || delivery.customerName,
        phone: details.customer?.phoneNumber || delivery.customerPhone,
        address: "N/A", // Add if available in model
        riderName: details.rider?.name || delivery.riderName,
        riderPhone: details.rider?.phoneNumber || delivery.riderPhone,
        items: "N/A", // Add if available in model
        orderTime: new Date(delivery.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        eta: delivery.eta ? new Date(delivery.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "N/A",
        amount: "N/A" // Add if available in model
      });
    } else {
      setSelectedOrder(delivery);
    }
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

const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedRider) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const newImage = reader.result;
      
        const updatedRiders = riders.map((r) => 
          r.id === selectedRider.id ? { ...r, profilePic: newImage } : r
        );
        setRiders(updatedRiders);

        setSelectedRider((prev) => ({ ...prev, profilePic: newImage }));
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="app">
      {/* === VIEW 1: DASHBOARD === */}
      {currentView === "dashboard" && (
        <>
          <img src={kapebaralogo} alt="Kapebara Logo" className="logo" />
          <div className="card">
            <h2 className="title">Admin Dashboard</h2>
            <div className="stats" style={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: '20px' }}>
              <div className="stat">
                <div className="avatar"></div>
                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Total Riders</p>
                <p style={{ fontSize: '1.2rem', color: '#364152' }}>{riders.length || 'Loading...'}</p>
                <button onClick={() => {
                  fetchRiders();
                  setCurrentView("riders");
                }}>
                  View Riders
                </button>
              </div>
              <div className="stat">
                <div className="avatar"></div>
                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Total Deliveries</p>
                <p style={{ fontSize: '1.2rem', color: '#364152' }}>{deliveries.length || 'Loading...'}</p>
                <button onClick={() => {
                  fetchDeliveries();
                  setCurrentView("deliveries");
                }}>
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
      {/* This is the active tab, clicking it keeps us here */}
      <span 
        className="tab active" 
        onClick={() => setCurrentView("riders")}
      >
        Rider's List
      </span>
      
      {/* This is the INACTIVE tab. Clicking it switches to 'deliveries' */}
      <span 
        className="tab" 
        onClick={() => setCurrentView("deliveries")}
        style={{ cursor: "pointer" }} /* Optional: ensures hand cursor shows */
      >
        On-Going deliveries
      </span>
    </div>
          <div className="list-card">
            <div className="list-header">
              <span>Rider name</span>
              <span>Load</span>
              <span>Availability</span>
            </div>

            <div className="riders-list">
              {riders.map((rider) => {
                const loadColor = rider.loadPercentage >= 80 ? '#f44336' : 
                                 rider.loadPercentage >= 50 ? '#ff9800' : 
                                 '#4CAF50';
                return (
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

                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      minWidth: '80px'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: loadColor,
                        fontSize: '0.9rem'
                      }}>
                        {rider.currentLoad || 0}/{rider.maxLoad || 5}
                      </div>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '3px',
                        marginTop: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${rider.loadPercentage || 0}%`,
                          height: '100%',
                          backgroundColor: loadColor,
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>

                    <div className="status-select">
                      <select 
                        defaultValue={rider.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const isAvailable = newStatus === "Available";
                          try {
                            const response = await fetch(`${API_BASE_URL}/api/riders/${rider.id}/availability`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isAvailable })
                            });
                            if (response.ok) {
                              await fetchRiders();
                            }
                          } catch (err) {
                            console.error('Error updating availability:', err);
                          }
                        }}
                      >
                        <option value="Available">Available</option>
                        <option value="On Delivery">On Delivery</option>
                        <option value="Break">Break</option>
                      </select>
                    </div>
                  </div>
                );
              })}
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
      {/* This is the INACTIVE tab. Clicking it switches to 'riders' */}
      <span 
        className="tab" 
        onClick={() => setCurrentView("riders")}
        style={{ cursor: "pointer" }}
      >
        Rider's List
      </span>

      {/* This is the active tab */}
      <span 
        className="tab active" 
        onClick={() => setCurrentView("deliveries")}
      >
        On-Going Deliveries
      </span>
    </div>
          <div className="list-card delivery-table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#364152" }}>
                Delivery Management
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '0.9rem'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="PickedUp">Picked Up</option>
                <option value="InTransit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {error && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f5e6d3', 
                color: '#642f19', 
                borderRadius: '4px', 
                marginBottom: '20px',
                border: '1px solid #aa6e39',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#642f19',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0 8px',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading deliveries...</div>
            ) : deliveries.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No deliveries found.
              </div>
            ) : (
              <div className="delivery-table-wrapper">
                <table className="delivery-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Rider Assigned</th>
                      <th>ETA</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.deliveryId}>
                        <td className="order-id">#{delivery.orderId || delivery.deliveryId}</td>
                        <td>{delivery.customerName || 'N/A'}</td>
                        <td>{delivery.riderName || 'Unassigned'}</td>
                        <td>
                          {delivery.eta 
                            ? new Date(delivery.eta).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              delivery.status
                            )}`}
                          >
                            {formatStatus(delivery.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {!delivery.riderId && (
                              <span
                                className="view-order-link"
                                onClick={() => handleAutoAssign(delivery.orderId)}
                                style={{ 
                                  cursor: 'pointer', 
                                  color: '#aa6e39',
                                  fontWeight: 'bold',
                                  fontSize: '0.85rem'
                                }}
                                title="Auto-assign to least loaded available rider"
                              >
                                Auto-Assign
                              </span>
                            )}
                            <span
                              className="view-order-link"
                              onClick={() => handleViewOrder(delivery)}
                              style={{ cursor: 'pointer' }}
                            >
                              View
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              {/* === AVATAR UPLOAD SECTION === */}
              <div className="avatar-upload-container">
                <label htmlFor="photo-upload" className="avatar-wrapper">
                  {/* Show uploaded image OR the default icon */}
                  {selectedRider.profilePic ? (
                    <img src={selectedRider.profilePic} alt="Rider" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="#364152">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="avatar-overlay">
                    <span>Change</span>
                  </div>
                </label>
                
                {/* Hidden Input */}
                <input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ display: "none" }} 
                />
              </div>
              {/* === END AVATAR SECTION === */}

              <h2>{selectedRider.name}</h2>
              <p className="rider-id">Rider ID: {selectedRider.riderId}</p>
            </div>

            {/* === YOU WERE MISSING THIS BODY SECTION === */}
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
                <div style={{ 
                  marginTop: '15px', 
                  padding: '12px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>Current Load</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {selectedRider.currentLoad || 0} / {selectedRider.maxLoad || 5}
                    </span>
                    <span style={{ 
                      color: (selectedRider.loadPercentage || 0) >= 80 ? '#f44336' : 
                             (selectedRider.loadPercentage || 0) >= 50 ? '#ff9800' : '#4CAF50',
                      fontWeight: 'bold'
                    }}>
                      {selectedRider.loadPercentage || 0}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${selectedRider.loadPercentage || 0}%`,
                      height: '100%',
                      backgroundColor: (selectedRider.loadPercentage || 0) >= 80 ? '#f44336' : 
                                     (selectedRider.loadPercentage || 0) >= 50 ? '#ff9800' : '#4CAF50',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                    {selectedRider.isAvailable && (selectedRider.currentLoad || 0) < (selectedRider.maxLoad || 5) 
                      ? 'Can accept more deliveries' 
                      : selectedRider.isAvailable 
                        ? 'At maximum capacity' 
                        : 'Currently unavailable'}
                  </p>
                </div>
              </div>

              <div className="info-section">
                <h3>Vehicle Info:</h3>
                <p>- Type: {selectedRider.vehicle}</p>
                <p>- Plate: {selectedRider.plate}</p>
              </div>
            </div>
            {/* === END OF MISSING BODY SECTION === */}

          </div>
        </div>
      )}

      {/* === REASSIGN RIDER MODAL === */}
      {showReassignModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content reason-modal">
            <button className="close-btn" onClick={() => setShowReassignModal(false)}>
              ✖
            </button>

            <div className="modal-header">
              <h2>Reassign Rider</h2>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                Order #{selectedOrder.orderId}
              </p>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Current Rider:</strong> {selectedOrder.riderName || 'Unassigned'}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Select New Rider:
                </label>
                <select
                  id="rider-select"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">-- Select a rider --</option>
                  {riders
                    .filter(r => r.isAvailable && (r.currentLoad || 0) < (r.maxLoad || 5))
                    .sort((a, b) => (a.currentLoad || 0) - (b.currentLoad || 0))
                    .map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} - Load: {rider.currentLoad || 0}/{rider.maxLoad || 5} ({rider.loadPercentage || 0}%)
                      </option>
                    ))}
                </select>
                {riders.filter(r => r.isAvailable && (r.currentLoad || 0) < (r.maxLoad || 5)).length === 0 && (
                  <p style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '8px' }}>
                    No available riders with capacity
                  </p>
                )}
              </div>

              <div className="reason-action-buttons">
                <button
                  className="reason-btn confirm-btn"
                  onClick={() => {
                    const select = document.getElementById('rider-select');
                    const newRiderId = parseInt(select.value);
                    if (newRiderId) {
                      handleReassignRider(newRiderId);
                    } else {
                      alert('Please select a rider');
                    }
                  }}
                >
                  Confirm Reassignment
                </button>
                <button
                  className="reason-btn cancel-btn"
                  onClick={() => setShowReassignModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === ORDER DETAILS POPUP MODAL === */}
      {selectedOrder && !showFailedReasonModal && !showReassignModal && (
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
                  Order ID: #{selectedOrder.orderId || selectedOrder.deliveryId}
                </span>
                <span
                  className={`status-badge ${getStatusClass(
                    selectedOrder.status
                  )}`}
                >
                  Status: {formatStatus(selectedOrder.status)}
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
                  <button
                    className="action-btn"
                    onClick={() => {
                      fetchRiders();
                      setShowReassignModal(true);
                    }}
                    style={{
                      backgroundColor: '#aa6e39',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginTop: '10px',
                      width: '100%'
                    }}
                  >
                    Reassign Rider
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

export default AdminRider;