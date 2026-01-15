// Enable mock data mode by setting this to true
// Or set USE_MOCK_DATA=true in localStorage
// Default to true for easier testing
const USE_MOCK_DATA = localStorage.getItem('USE_MOCK_DATA') !== 'false';

// Import mock services (static import)
import { mockAdminRiderService } from '@shared-mock-data/deliveryHistoryMockData.js';

const API_BASE_URL = {
  delivery: 'http://localhost:5003/api/deliveries',
  rider: 'http://localhost:5005/api/riders'
};

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

export const deliveryService = {
  getActiveDeliveries: async () => {
    return fetchApi(`${API_BASE_URL.delivery}/active`);
  },
  
  assignDelivery: async (orderId, riderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/assign`, {
      method: 'POST',
      body: JSON.stringify({ orderId, riderId })
    });
  },
  
  reassignDelivery: async (orderId, newRiderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ riderId: newRiderId })
    });
  },
  
  getDeliveryByOrderId: async (orderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}`);
  }
};

export const riderService = {
  getAllRiders: async () => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getAllRiders();
    }
    return fetchApi(`${API_BASE_URL.rider}`);
  },
  
  getRiderById: async (riderId) => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getRiderById(riderId);
    }
    return fetchApi(`${API_BASE_URL.rider}/${riderId}`);
  },
  
  getRiderProfile: async (riderId) => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getRiderById(riderId);
    }
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/profile`);
  },
  
  getRiderHistory: async (riderId, startDate = null, endDate = null) => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getRiderHistory(riderId, startDate, endDate);
    }
    let url = `${API_BASE_URL.rider}/${riderId}/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (params.toString()) url += `?${params.toString()}`;
    return fetchApi(url);
  },

  getAllDeliveryHistory: async (startDate = null, endDate = null) => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getAllDeliveryHistory(startDate, endDate);
    }
    let url = `${API_BASE_URL.delivery}/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    if (params.toString()) url += `?${params.toString()}`;
    return fetchApi(url);
  }
};
