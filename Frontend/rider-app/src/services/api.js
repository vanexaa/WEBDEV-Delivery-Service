// API Base URLs
const API_BASE_URL = {
  auth: 'http://localhost:5001/api/auth',
  delivery: 'http://localhost:5003/api/deliveries',
  rider: 'http://localhost:5005/api/riders',
  order: 'http://localhost:5009/api/orders'
};

// Get token from localStorage
const getToken = () => localStorage.getItem('authToken');

// Fetch wrapper with auth
const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Auth Service
export const authService = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL.auth}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },
  
  getCurrentUser: async () => {
    return fetchWithAuth(`${API_BASE_URL.auth}/me`);
  }
};

// Delivery Service
export const deliveryService = {
  getActiveDeliveries: async () => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/active`);
  },
  
  getDeliveryByOrderId: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}`);
  },
  
  updateDeliveryStatus: async (orderId, status, notes = null, latitude = null, longitude = null) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, latitude, longitude })
    });
  },
  
  markDeliveryAsFailed: async (orderId, reason) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}/failure`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },
  
  getDeliveryTracking: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}/track`);
  }
};

// Rider Service
export const riderService = {
  getRiderById: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}`);
  },
  
  getRiderProfile: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/profile`);
  },
  
  getAvailability: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/availability`);
  },
  
  updateAvailability: async (riderId, isOnline) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ isOnline })
    });
  },
  
  getEarnings: async (riderId, startDate = null, endDate = null) => {
    let url = `${API_BASE_URL.rider}/${riderId}/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (params.toString()) url += `?${params.toString()}`;
    
    return fetchWithAuth(url);
  },
  
  getFeedback: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/feedback`);
  },
  
  updateRiderProfile: async (riderId, profileData) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// Order Service
export const orderService = {
  getOrderById: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.order}/${orderId}`);
  }
};
