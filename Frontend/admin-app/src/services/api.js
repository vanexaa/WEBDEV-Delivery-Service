const API_BASE_URL = {
  auth: 'http://localhost:5001/api/auth',
  delivery: 'http://localhost:5003/api/deliveries',
  rider: 'http://localhost:5005/api/riders'
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

export const deliveryService = {
  getActiveDeliveries: async () => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/active`);
  },
  
  assignDelivery: async (orderId, riderId) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/assign`, {
      method: 'POST',
      body: JSON.stringify({ orderId, riderId })
    });
  },
  
  reassignDelivery: async (orderId, newRiderId) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ riderId: newRiderId })
    });
  },
  
  getDeliveryByOrderId: async (orderId) => {
    return fetchWithAuth(`${API_BASE_URL.delivery}/${orderId}`);
  }
};

export const riderService = {
  getRiderById: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}`);
  },
  
  getRiderProfile: async (riderId) => {
    return fetchWithAuth(`${API_BASE_URL.rider}/${riderId}/profile`);
  }
};
