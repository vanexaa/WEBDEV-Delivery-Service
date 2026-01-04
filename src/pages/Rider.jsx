import React, { useState } from 'react';
import { BsPerson } from 'react-icons/bs';
import '../css/Rider.css';

const ordersData = [
    { id: '123123', type: 'queue', customerName: 'Juan Dela Cruz', address: '101 Main St.', notes: 'Call upon arrival', items: '1x Espresso, 1x Pastel De Nata' },
    { id: '321321', type: 'queue', customerName: 'Maria Santos', address: '202 Oak Ave.', notes: 'Leave at guard house', items: '2x Iced Latte, 1x Croissant' },
    { id: '696969', type: 'queue', customerName: 'Boss Oleg', address: '322 kanto nila fitz', notes: 'Delivery Notes (if any)', items: 'Barako, 3-in-1' },
    { id: '007', type: 'assigned', customerName: 'James Bond', status: 'In transit', address: 'Secret Lair, Manila', contact: '09XX-XXX-007', payment: 'Cash' },
];

const Rider = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [currentStatus, setCurrentStatus] = useState("In transit");

    const statusOptions = ["Picked Up", "In Transit", "Delivered", "Failed"];

    const orderQueueData = ordersData.filter(o => o.type === 'queue');
    const assignedOrdersData = ordersData.filter(o => o.type === 'assigned');

    return (
        <div className="app">
            <div className="order-dashboard-container">
                {/* Header: Profile and Toggle */}
                <div className="top-header-section">
                    <BsPerson className="profile-icon" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }} />
                    <label className="rider-toggle">
                        <input type="checkbox" checked={isOnline} onChange={() => setIsOnline(!isOnline)} />
                        <span className="slider"></span>
                    </label>
                </div>

                {/* Dashboard: Two Column Layout */}
                <div className="dashboard-columns-container">
                    <div className="order-card">
                        <h2 className="order-card-title">Order Queue</h2>
                        {orderQueueData.map(order => (
                            <div className="order-item-row" key={order.id}>
                                <span className="subheading">Order #{order.id}</span>
                                <button className="btn-view-accept-custom" onClick={() => setSelectedOrder(order)}>View</button>
                            </div>
                        ))}
                    </div>

                    <div className="order-card">
                        <h2 className="order-card-title">Assigned Orders</h2>
                        {assignedOrdersData.map(order => (
                            <div className="order-item-row" key={order.id}>
                                <span className="subheading">Order #{order.id}</span>
                                <button className="btn-view-accept-custom" onClick={() => setSelectedOrder(order)}>View</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* POPUP: RIDER PROFILE */}
            {showProfile && (
                <div className="modal-overlay-new" onClick={() => setShowProfile(false)}>
                    <div className="order-details-modal profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-left">
                            <button className="btn-close-brown" onClick={() => setShowProfile(false)}>✕</button>
                        </div>
                        <div className="profile-header">
                            <div className="profile-icon-large"><BsPerson /></div>
                            <div className="details-content subheading">
                                <p><strong>NAME:</strong> Rider Name</p>
                                <p><strong>RIDER #:</strong> 001</p>
                                <p><strong>VEHICLE:</strong> Motorcycle</p>
                                <p><strong>PLATE:</strong> ABC-1234</p>
                                <button className="btn-decline-custom logout-btn">LOGOUT</button>
                            </div>
                        </div>
                        <h2 className="order-card-title" style={{textAlign: 'center'}}>DELIVERY HISTORY</h2>
                        <table className="history-table subheading">
                            <thead>
                                <tr><th>ORDER ID</th><th>CUSTOMER</th><th>DATE</th><th>STATUS</th><th>RATING</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>#123123</td><td>Juan Dela Cruz</td><td>01/01/26</td><td>Delivered</td><td>5/5</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* POPUP: ORDER QUEUE (New Request) */}
            {selectedOrder && selectedOrder.type === 'queue' && (
                <div className="modal-overlay-new" onClick={() => setSelectedOrder(null)}>
                    <div className="order-details-modal rounded-50" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-left">
                            <button className="btn-close-brown" onClick={() => setSelectedOrder(null)}>✕</button>
                        </div>
                        <h2 className="order-card-title" style={{textAlign: 'center'}}>Order Details</h2>
                        <div className="details-content subheading">
                            <p>Order #{selectedOrder.id}</p>
                            <p><strong>Customer Name:</strong> {selectedOrder.customerName}</p>
                            <p><strong>Delivery Address:</strong> {selectedOrder.address}</p>
                            <p><strong>Delivery Notes:</strong> {selectedOrder.notes}</p>
                            <div className="details-items">
                                <p><strong>Items:</strong></p>
                                <p>{selectedOrder.items}</p>
                            </div>
                        </div>
                        <div className="action-buttons-queue">
                            <button className="btn-decline-custom pill-btn" onClick={() => setSelectedOrder(null)}>Decline</button>
                            <button className="btn-accept-custom pill-btn" onClick={() => setSelectedOrder(null)}>Accept</button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP: ASSIGNED DETAILS (Status Update) */}
            {selectedOrder && selectedOrder.type === 'assigned' && (
                <div className="modal-overlay-new" onClick={() => setSelectedOrder(null)}>
                    <div className="order-details-modal rounded-40" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-left">
                            <button className="btn-close-brown" onClick={() => setSelectedOrder(null)}>✕</button>
                        </div>
                        <h2 className="order-card-title" style={{textAlign: 'center'}}>Order Details</h2>
                        <div className="status-update-container subheading">
                            <div className="details-content">
                                <p>Order #{selectedOrder.id}</p>
                                <p>Status: {currentStatus}</p>
                                <p style={{ marginTop: '10px' }}><strong>Customer Info:</strong></p>
                                <p>Name: {selectedOrder.customerName}</p>
                                <p>Address: {selectedOrder.address}</p>
                                <p>Contact: {selectedOrder.contact}</p>
                                <p>Payment: {selectedOrder.payment}</p>
                            </div>
                            <div className="status-selection">
                                <span style={{ fontSize: '0.8rem' }}>Update Status: </span>
                                <div className="status-dropdown-trigger" onClick={() => setShowStatusDropdown(!showStatusDropdown)}>▼</div>
                                {showStatusDropdown && (
                                    <div className="status-dropdown-list">
                                        {statusOptions.map(opt => (
                                            <div key={opt} className="status-item" onClick={() => { setCurrentStatus(opt); setShowStatusDropdown(false); }}>{opt}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button className="btn-delivery-action subheading" onClick={() => setSelectedOrder(null)}>Order Delivered</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rider;