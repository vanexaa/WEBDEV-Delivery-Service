// API Base URLs
const API_BASE_URL = {
  auth: 'http://localhost:5001/api/auth',
  delivery: 'http://localhost:5003/api/deliveries',
  rider: 'http://localhost:5005/api/riders',
  customer: 'http://localhost:5007/api/customers',
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
    let errorData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        errorData = { message: text || `HTTP error! status: ${response.status}` };
      }
    } catch (parseError) {
      errorData = { message: `Request failed with status ${response.status}` };
    }
    
    const errorMessage = errorData.message || errorData.errors || `HTTP error! status: ${response.status}`;
    const err = new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    err.response = response;
    err.errorData = errorData;
    err.status = response.status;
    throw err;
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
  
  getEarnings: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/history`);
  }
};

// Customer Service
export const customerService = {
  getRiderInfo: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.customer}/${orderId}/rider`);
  },
  
  getETA: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.customer}/${orderId}/eta`);
  },
  
  submitFeedback: async (orderId, rating, comment) => {
    return fetchWithAuth(`${API_BASE_URL.customer}/${orderId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  }
};

// Order Service (separate microservice)
export const orderService = {
  createOrder: async (orderData) => {
    return fetchWithAuth(API_BASE_URL.order, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  
  getAllOrders: async () => {
    return fetchWithAuth(API_BASE_URL.order);
  },
  
  getOrderById: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.order}/${orderId}`);
  }
};
