const API_BASE_URL = {
  auth: 'http://localhost:5001/api/auth',
  customer: 'http://localhost:5007/api/customers',
  delivery: 'http://localhost:5003/api/deliveries',
  order: 'http://localhost:5009/api/orders'
};

const getToken = () => localStorage.getItem('authToken');

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
  }
};

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

export const deliveryService = {
  getDeliveryByOrderId: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}`);
  },
  
  submitFeedback: async (orderId, rating, comment) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  }
};

export const orderService = {
  getOrderById: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.order}/${orderId}`);
  }
};
