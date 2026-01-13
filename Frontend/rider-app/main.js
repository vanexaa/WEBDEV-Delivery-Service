// API Configuration
const API_BASE_URL = {
    auth: 'http://localhost:5001/api/auth',
    delivery: 'http://localhost:5003/api/deliveries',
    rider: 'http://localhost:5005/api/riders'
};

// State Management
let currentUser = null;
let currentRiderId = null;
let authToken = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    const riderId = localStorage.getItem('riderId');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        currentRiderId = riderId ? parseInt(riderId) : null;
        showDashboard();
    } else {
        showLogin();
    }
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Navigation
    document.getElementById('nav-orders').addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
    document.getElementById('nav-earnings').addEventListener('click', (e) => {
        e.preventDefault();
        showEarnings();
    });
    document.getElementById('nav-logout').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // Availability toggle
    document.getElementById('availability-toggle').addEventListener('change', handleAvailabilityToggle);
    
    // Back button
    document.getElementById('back-to-orders').addEventListener('click', () => {
        showDashboard();
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_BASE_URL.auth}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.user.role !== 'Rider') {
            throw new Error('Access denied. This is for riders only.');
        }
        
        // Store auth data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Get rider ID
        await fetchRiderId();
        
        showDashboard();
        errorDiv.classList.add('d-none');
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    }
}

async function fetchRiderId() {
    try {
        // This would typically call the rider service to get rider by userId
        // For now, assuming userId = riderId (you'll need to adjust based on your data)
        const response = await fetch(`${API_BASE_URL.rider}/${currentUser.userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const rider = await response.json();
            currentRiderId = rider.riderId;
            localStorage.setItem('riderId', rider.riderId.toString());
        }
    } catch (error) {
        console.error('Error fetching rider ID:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('riderId');
    authToken = null;
    currentUser = null;
    currentRiderId = null;
    showLogin();
}

// Page Navigation
function showLogin() {
    hideAllPages();
    document.getElementById('login-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.add('d-none');
}

function showDashboard() {
    hideAllPages();
    document.getElementById('dashboard-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.remove('d-none');
    loadActiveOrders();
    loadAvailabilityStatus();
}

function showOrderDetails(orderId) {
    hideAllPages();
    document.getElementById('order-details-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.remove('d-none');
    loadOrderDetails(orderId);
}

function showEarnings() {
    hideAllPages();
    document.getElementById('earnings-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.remove('d-none');
    loadEarnings();
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('d-none');
    });
}

// Availability Functions
async function loadAvailabilityStatus() {
    if (!currentRiderId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL.rider}/${currentRiderId}/availability`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const availability = await response.json();
            const toggle = document.getElementById('availability-toggle');
            const statusText = document.getElementById('availability-status-text');
            const label = document.getElementById('availability-label');
            
            toggle.checked = availability.isOnline;
            statusText.textContent = availability.isOnline ? 'Currently Online' : 'Currently Offline';
            label.textContent = availability.isOnline ? 'Go Offline' : 'Go Online';
        }
    } catch (error) {
        console.error('Error loading availability:', error);
    }
}

async function handleAvailabilityToggle(e) {
    if (!currentRiderId) return;
    
    const isOnline = e.target.checked;
    
    try {
        const response = await fetch(`${API_BASE_URL.rider}/${currentRiderId}/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ isOnline })
        });
        
        if (response.ok) {
            const statusText = document.getElementById('availability-status-text');
            const label = document.getElementById('availability-label');
            statusText.textContent = isOnline ? 'Currently Online' : 'Currently Offline';
            label.textContent = isOnline ? 'Go Offline' : 'Go Online';
        } else {
            e.target.checked = !isOnline; // Revert on error
        }
    } catch (error) {
        console.error('Error updating availability:', error);
        e.target.checked = !isOnline; // Revert on error
    }
}

// Orders Functions
async function loadActiveOrders() {
    try {
        const response = await fetch(`${API_BASE_URL.delivery}/active`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        
        const deliveries = await response.json();
        displayOrders(deliveries.filter(d => d.riderId === currentRiderId));
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = 
            '<div class="col-12"><div class="alert alert-warning">No active orders found.</div></div>';
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="col-12"><div class="alert alert-info">No active orders at the moment.</div></div>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card order-card" onclick="showOrderDetails(${order.orderId})">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title">Order #${order.orderId}</h6>
                        <span class="badge bg-primary status-badge">${order.status}</span>
                    </div>
                    <p class="card-text mb-1"><small class="text-muted">Customer:</small> ${order.order?.customerName || 'N/A'}</p>
                    <p class="card-text mb-1"><small class="text-muted">Address:</small> ${order.order?.deliveryAddress?.substring(0, 30) || 'N/A'}...</p>
                    <p class="card-text"><small class="text-muted">Assigned:</small> ${new Date(order.assignedAt).toLocaleString()}</p>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL.delivery}/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load order details');
        }
        
        const delivery = await response.json();
        displayOrderDetails(delivery);
    } catch (error) {
        console.error('Error loading order details:', error);
        document.getElementById('order-details-content').innerHTML = 
            '<div class="alert alert-danger">Error loading order details.</div>';
    }
}

function displayOrderDetails(delivery) {
    const content = document.getElementById('order-details-content');
    const order = delivery.order || {};
    
    const statusButtons = getStatusButtons(delivery);
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-muted mb-3">Order Information</h6>
                <div class="order-info-row">
                    <div class="order-info-label">Order ID</div>
                    <div class="order-info-value">#${delivery.orderId}</div>
                </div>
                <div class="order-info-row">
                    <div class="order-info-label">Status</div>
                    <div class="order-info-value"><span class="badge bg-primary">${delivery.status}</span></div>
                </div>
                <div class="order-info-row">
                    <div class="order-info-label">Customer Name</div>
                    <div class="order-info-value">${order.customerName || 'N/A'}</div>
                </div>
                <div class="order-info-row">
                    <div class="order-info-label">Customer Phone</div>
                    <div class="order-info-value">
                        <a href="tel:${order.customerPhone}" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-telephone"></i> ${order.customerPhone}
                        </a>
                    </div>
                </div>
                <div class="order-info-row">
                    <div class="order-info-label">Delivery Address</div>
                    <div class="order-info-value">${order.deliveryAddress || 'N/A'}</div>
                </div>
                <div class="order-info-row">
                    <div class="order-info-label">Special Instructions</div>
                    <div class="order-info-value">${order.specialInstructions || 'None'}</div>
                </div>
            </div>
            <div class="col-md-6">
                <h6 class="text-muted mb-3">Actions</h6>
                ${statusButtons}
                <div class="mt-3">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${order.deliveryAddress}" 
                       target="_blank" 
                       class="btn btn-success w-100">
                        <i class="bi bi-geo-alt"></i> Navigate with Google Maps
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Attach event listeners to status buttons
    attachStatusButtonListeners(delivery.orderId);
}

function getStatusButtons(delivery) {
    const status = delivery.status;
    let buttons = '';
    
    if (status === 'Assigned') {
        buttons += '<button class="btn btn-primary w-100 mb-2" onclick="updateOrderStatus(' + delivery.orderId + ', \'Accepted\')">Accept Order</button>';
    }
    if (status === 'Accepted' || status === 'Assigned') {
        buttons += '<button class="btn btn-warning w-100 mb-2" onclick="updateOrderStatus(' + delivery.orderId + ', \'PickedUp\')">Mark as Picked Up</button>';
    }
    if (status === 'PickedUp') {
        buttons += '<button class="btn btn-info w-100 mb-2" onclick="updateOrderStatus(' + delivery.orderId + ', \'InTransit\')">Mark as In Transit</button>';
    }
    if (status === 'InTransit' || status === 'PickedUp') {
        buttons += '<button class="btn btn-success w-100 mb-2" onclick="updateOrderStatus(' + delivery.orderId + ', \'Delivered\')">Mark as Delivered</button>';
    }
    buttons += '<button class="btn btn-danger w-100" onclick="markOrderFailed(' + delivery.orderId + ')">Mark as Failed</button>';
    
    return buttons;
}

function attachStatusButtonListeners(orderId) {
    // Event listeners are attached via onclick in the HTML
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL.delivery}/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            alert('Order status updated successfully!');
            showDashboard();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Failed to update status'));
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status');
    }
}

async function markOrderFailed(orderId) {
    const reason = prompt('Please provide a reason for failure:');
    if (!reason) return;
    
    try {
        const response = await fetch(`${API_BASE_URL.delivery}/${orderId}/failure`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            alert('Order marked as failed');
            showDashboard();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Failed to mark as failed'));
        }
    } catch (error) {
        console.error('Error marking order as failed:', error);
        alert('Error marking order as failed');
    }
}

// Earnings Functions
async function loadEarnings() {
    if (!currentRiderId) return;
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const response = await fetch(`${API_BASE_URL.rider}/${currentRiderId}/history?startDate=${today.toISOString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const earnings = await response.json();
            displayEarnings(earnings);
        }
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
}

function displayEarnings(earnings) {
    const todayEarnings = earnings.filter(e => {
        const earningDate = new Date(e.earningDate);
        const today = new Date();
        return earningDate.toDateString() === today.toDateString();
    });
    
    const todayDeliveries = todayEarnings.length;
    const todayTotal = todayEarnings.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    
    document.getElementById('today-deliveries').textContent = todayDeliveries;
    document.getElementById('today-earnings').textContent = `$${todayTotal.toFixed(2)}`;
    
    const tableBody = document.getElementById('earnings-table-body');
    tableBody.innerHTML = earnings.map(earning => `
        <tr>
            <td>${new Date(earning.earningDate).toLocaleDateString()}</td>
            <td>#${earning.orderId}</td>
            <td>$${parseFloat(earning.amount || 0).toFixed(2)}</td>
            <td><span class="badge bg-${earning.status === 'Paid' ? 'success' : 'warning'}">${earning.status}</span></td>
        </tr>
    `).join('');
}

// Make functions available globally for onclick handlers
window.showOrderDetails = showOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.markOrderFailed = markOrderFailed;
