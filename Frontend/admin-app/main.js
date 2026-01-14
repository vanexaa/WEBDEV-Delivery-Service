// API Configuration
const API_BASE_URL = {
    auth: 'http://localhost:5001/api/auth',
    delivery: 'http://localhost:5003/api/deliveries',
    rider: 'http://localhost:5005/api/riders'
};

// State Management
let currentUser = null;
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
    
    if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === 'Admin') {
            authToken = token;
            currentUser = userData;
            showDashboard();
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
    document.getElementById('nav-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
    document.getElementById('nav-riders').addEventListener('click', (e) => {
        e.preventDefault();
        showRiders();
    });
    document.getElementById('nav-deliveries').addEventListener('click', (e) => {
        e.preventDefault();
        showDeliveries();
    });
    document.getElementById('nav-logout').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
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
        
        if (data.user.role !== 'Admin') {
            throw new Error('Access denied. Admin access required.');
        }
        
        // Store auth data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showDashboard();
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
    loadDashboardStats();
    loadRecentDeliveries();
}

function showRiders() {
    hideAllPages();
    document.getElementById('riders-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.remove('d-none');
    loadRiders();
}

function showDeliveries() {
    hideAllPages();
    document.getElementById('deliveries-page').classList.remove('d-none');
    document.querySelector('.navbar').classList.remove('d-none');
    loadAllDeliveries();
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('d-none');
    });
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        const deliveriesResponse = await fetch(`${API_BASE_URL.delivery}/active`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (deliveriesResponse.ok) {
            const deliveries = await deliveriesResponse.json();
            document.getElementById('stat-active-deliveries').textContent = deliveries.length;
            document.getElementById('stat-pending').textContent = 
                deliveries.filter(d => d.status === 'Assigned').length;
        }
        
        // Note: Online riders count would require additional API call
        document.getElementById('stat-online-riders').textContent = 'N/A';
        document.getElementById('stat-today').textContent = 'N/A';
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentDeliveries() {
    try {
        const response = await fetch(`${API_BASE_URL.delivery}/active`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const deliveries = await response.json();
            displayDeliveries(deliveries.slice(0, 10), 'deliveries-table-body');
        }
    } catch (error) {
        console.error('Error loading recent deliveries:', error);
    }
}

// Riders Functions
async function loadRiders() {
    // Note: This would require a GET /api/riders endpoint
    // For now, showing placeholder
    document.getElementById('riders-table-body').innerHTML = 
        '<tr><td colspan="5" class="text-center">Rider list functionality requires additional API endpoint</td></tr>';
}

// Deliveries Functions
async function loadAllDeliveries() {
    try {
        const response = await fetch(`${API_BASE_URL.delivery}/active`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const deliveries = await response.json();
            displayDeliveries(deliveries, 'all-deliveries-table-body');
        }
    } catch (error) {
        console.error('Error loading deliveries:', error);
    }
}

function displayDeliveries(deliveries, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    
    if (deliveries.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No deliveries found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = deliveries.map(delivery => {
        const order = delivery.order || {};
        return `
            <tr>
                <td>#${delivery.orderId}</td>
                <td>${delivery.riderId ? `Rider #${delivery.riderId}` : 'Unassigned'}</td>
                <td>${order.customerName || 'N/A'}</td>
                <td><span class="badge bg-primary">${delivery.status}</span></td>
                <td>${new Date(delivery.assignedAt).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewDelivery(${delivery.orderId})">View</button>
                    ${delivery.riderId ? `<button class="btn btn-sm btn-warning" onclick="reassignDelivery(${delivery.orderId})">Reassign</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function viewDelivery(orderId) {
    alert('View delivery details for order #' + orderId);
    // In a real implementation, this would open a modal or navigate to a details page
}

function reassignDelivery(orderId) {
    const newRiderId = prompt('Enter new rider ID:');
    if (!newRiderId) return;
    
    // In a real implementation, this would call the reassign API
    alert('Reassignment functionality requires API integration');
}

// Make functions available globally
window.viewDelivery = viewDelivery;
window.reassignDelivery = reassignDelivery;
