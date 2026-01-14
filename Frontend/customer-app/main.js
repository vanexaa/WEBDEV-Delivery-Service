// API Configuration
const API_BASE_URL = {
    auth: 'http://localhost:5001/api/auth',
    customer: 'http://localhost:5007/api/customers',
    delivery: 'http://localhost:5003/api/deliveries'
};

// State Management
let currentUser = null;
let authToken = null;
let currentOrderId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === 'Customer') {
            authToken = token;
            currentUser = userData;
            showTrackPage();
        } else {
            localStorage.clear();
            showLogin();
        }
    } else {
        showLogin();
    }
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Navigation
    document.getElementById('nav-track').addEventListener('click', (e) => {
        e.preventDefault();
        showTrackPage();
    });
    document.getElementById('nav-logout').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // Track button
    document.getElementById('track-btn').addEventListener('click', handleTrackOrder);
    document.getElementById('order-id-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleTrackOrder();
        }
    });
    
    // Feedback form
    document.getElementById('feedback-form').addEventListener('submit', handleSubmitFeedback);
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
        
        if (data.user.role !== 'Customer') {
            throw new Error('Access denied. Customer access required.');
        }
        
        // Store auth data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showTrackPage();
        errorDiv.classList.add('d-none');
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    currentOrderId = null;
    showLogin();
}

// Page Navigation
function showLogin() {
    hideAllPages();
    document.getElementById('login-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.add('d-none');
}

function showTrackPage() {
    hideAllPages();
    document.getElementById('track-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.remove('d-none');
    document.getElementById('tracking-info').classList.add('d-none');
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('d-none');
    });
}

// Track Order Functions
async function handleTrackOrder() {
    const orderId = document.getElementById('order-id-input').value;
    if (!orderId) {
        alert('Please enter an order ID');
        return;
    }
    
    currentOrderId = parseInt(orderId);
    await loadOrderTracking(currentOrderId);
}

async function loadOrderTracking(orderId) {
    try {
        // Load delivery tracking
        const trackingResponse = await fetch(`${API_BASE_URL.delivery}/${orderId}/track`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!trackingResponse.ok) {
            throw new Error('Order not found');
        }
        
        const tracking = await trackingResponse.json();
        
        // Load rider info
        let riderInfo = null;
        try {
            const riderResponse = await fetch(`${API_BASE_URL.customer}/${orderId}/rider`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (riderResponse.ok) {
                riderInfo = await riderResponse.json();
            }
        } catch (error) {
            console.error('Error loading rider info:', error);
        }
        
        // Load ETA
        let eta = null;
        try {
            const etaResponse = await fetch(`${API_BASE_URL.customer}/${orderId}/eta`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (etaResponse.ok) {
                eta = await etaResponse.json();
            }
        } catch (error) {
            console.error('Error loading ETA:', error);
        }
        
        displayTrackingInfo(tracking, riderInfo, eta);
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Error loading tracking:', error);
    }
}

function displayTrackingInfo(tracking, riderInfo, eta) {
    document.getElementById('track-order-id').textContent = `#${tracking.orderId}`;
    document.getElementById('track-status').textContent = tracking.status;
    
    if (eta && eta.estimatedTime) {
        document.getElementById('track-eta').textContent = `${eta.estimatedTime} minutes`;
    } else {
        document.getElementById('track-eta').textContent = 'Not available';
    }
    
    // Display rider info
    if (riderInfo) {
        document.getElementById('rider-name').textContent = riderInfo.fullName;
        const phoneLink = document.getElementById('rider-phone-link');
        phoneLink.href = `tel:${riderInfo.phoneNumber}`;
        phoneLink.innerHTML = `<i class="bi bi-telephone"></i> ${riderInfo.phoneNumber}`;
        document.getElementById('rider-info-card').style.display = 'block';
    } else {
        document.getElementById('rider-info-card').style.display = 'none';
    }
    
    // Display status timeline
    displayStatusTimeline(tracking.statusHistory || []);
    
    // Show feedback form if delivered
    if (tracking.status === 'Delivered') {
        document.getElementById('feedback-card').style.display = 'block';
    } else {
        document.getElementById('feedback-card').style.display = 'none';
    }
    
    document.getElementById('tracking-info').classList.remove('d-none');
}

function displayStatusTimeline(statusHistory) {
    const timeline = document.getElementById('status-timeline');
    const statusOrder = ['Assigned', 'Accepted', 'PickedUp', 'InTransit', 'Delivered'];
    const currentStatus = document.getElementById('track-status').textContent;
    
    if (statusHistory.length === 0) {
        timeline.innerHTML = '<p class="text-muted">No status updates yet</p>';
        return;
    }
    
    timeline.innerHTML = statusHistory.map(item => {
        const isActive = item.status === currentStatus;
        return `
            <div class="timeline-item ${isActive ? 'active' : ''}">
                <h6>${item.status}</h6>
                <small class="text-muted">${new Date(item.timestamp).toLocaleString()}</small>
                ${item.notes ? `<p class="mt-2 mb-0">${item.notes}</p>` : ''}
            </div>
        `;
    }).join('');
}

// Feedback Functions
async function handleSubmitFeedback(e) {
    e.preventDefault();
    
    if (!currentOrderId) {
        alert('Please track an order first');
        return;
    }
    
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    if (!ratingInput) {
        alert('Please select a rating');
        return;
    }
    
    const rating = parseInt(ratingInput.value);
    const comment = document.getElementById('feedback-comment').value;
    
    try {
        const response = await fetch(`${API_BASE_URL.customer}/${currentOrderId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ rating, comment })
        });
        
        if (response.ok) {
            alert('Thank you for your feedback!');
            document.getElementById('feedback-form').reset();
            document.getElementById('feedback-card').style.display = 'none';
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Failed to submit feedback'));
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Error submitting feedback');
    }
}
