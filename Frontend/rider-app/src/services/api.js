// API Base URLs
const API_BASE_URL = {
  delivery: 'http://localhost:5003/api/deliveries',
  rider: 'http://localhost:5005/api/riders',
  order: 'http://localhost:5009/api/orders'
};

// Fetch wrapper (authentication removed)
const fetchApi = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
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

// Delivery Service
export const deliveryService = {
  getActiveDeliveries: async () => {
    return fetchApi(`${API_BASE_URL.delivery}/active`);
  },
  
  getDeliveryByOrderId: async (orderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}`);
  },
  
  updateDeliveryStatus: async (orderId, status, notes = null, latitude = null, longitude = null) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, latitude, longitude })
    });
  },
  
  markDeliveryAsFailed: async (orderId, reason) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/failure`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },
  
  getDeliveryTracking: async (orderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/track`);
  }
};

// Rider Service
export const riderService = {
  getRiderById: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}`);
  },
  
  getRiderProfile: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/profile`);
  },
  
  getAvailability: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/availability`);
  },
  
  updateAvailability: async (riderId, isOnline) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/availability`, {
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
    
    return fetchApi(url);
  },
  
  getFeedback: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/feedback`);
  },
  
  updateRiderProfile: async (riderId, profileData) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// Order Service
export const orderService = {
  getOrderById: async (orderId) => {
    return fetchApi(`${API_BASE_URL.order}/${orderId}`);
  }
};
