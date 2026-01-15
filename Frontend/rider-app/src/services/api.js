// Enable mock data mode by setting this to true
// Or set USE_MOCK_DATA=true in localStorage
// Default to true for easier testing
const USE_MOCK_DATA = localStorage.getItem('USE_MOCK_DATA') !== 'false';

// Import mock services (static import)
import { mockRiderHistoryService, mockCustomerOrderService } from '@shared-mock-data/deliveryHistoryMockData.js';

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
    // Note: This requires riderId from context, so it's handled in DashboardPage
    // For mock data, we'll return empty array here and let the page handle it
    if (USE_MOCK_DATA) {
      return [];
    }
    return fetchApi(`${API_BASE_URL.delivery}/active`);
  },
  
  getDeliveryByOrderId: async (orderId) => {
    if (USE_MOCK_DATA && mockCustomerOrderService) {
      return mockCustomerOrderService.getDeliveryByOrderId(orderId);
    }
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
  
  getRiderOnlinePayments: async (riderId, startDate = null, endDate = null) => {
    if (USE_MOCK_DATA && mockRiderHistoryService) {
      return mockRiderHistoryService.getRiderOnlinePayments(riderId, startDate, endDate);
    }
    let url = `${API_BASE_URL.rider}/${riderId}/online-payments`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (params.toString()) url += `?${params.toString()}`;
    
    return fetchApi(url);
  },
  
  getRiderHistory: async (riderId, startDate = null, endDate = null) => {
    if (USE_MOCK_DATA && mockRiderHistoryService) {
      return mockRiderHistoryService.getRiderHistory(riderId, startDate, endDate);
    }
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
    if (USE_MOCK_DATA && mockCustomerOrderService) {
      return mockCustomerOrderService.getOrderById(orderId);
    }
    return fetchApi(`${API_BASE_URL.order}/${orderId}`);
  }
};
