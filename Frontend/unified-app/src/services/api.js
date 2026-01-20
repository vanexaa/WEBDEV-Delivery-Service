/*
 * UnifiedService Architecture - Unified Frontend API Service
 * 
 * All services are accessible through UnifiedService on port 5000.
 * 
 * Benefits:
 * - One port to manage (5000) instead of multiple ports
 * - Simpler deployment - single backend service
 * - No API Gateway needed - direct API calls
 * - Easier debugging and development
 * 
 * All endpoints: http://localhost:5000/api/*
 */

// Enable mock data mode by setting this to true
// Or set USE_MOCK_DATA=true in localStorage
// Default to false for production
const USE_MOCK_DATA = localStorage.getItem('USE_MOCK_DATA') === 'true';

// Import mock services if available
let mockRiderHistoryService, mockCustomerOrderService, mockAdminRiderService;
try {
  const mockData = require('../shared-mock-data/deliveryHistoryMockData.js');
  mockRiderHistoryService = mockData.mockRiderHistoryService;
  mockCustomerOrderService = mockData.mockCustomerOrderService;
  mockAdminRiderService = mockData.mockAdminRiderService;
} catch (e) {
  // Mock data not available, continue without it
}

const API_BASE_URL = {
  auth: 'http://localhost:5000/api/auth',
  delivery: 'http://localhost:5000/api/deliveries',
  rider: 'http://localhost:5000/api/riders',
  order: 'http://localhost:5000/api/orders',
  customer: 'http://localhost:5000/api/customers'
};

const fetchApi = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.title || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to UnifiedService. Please check if the backend is running on port 5000.');
    }
    throw error;
  }
};

// Auth Service
export const authService = {
  login: async (username, password) => {
    return fetchApi(`${API_BASE_URL.auth}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  getCurrentUser: async () => {
    return fetchApi(`${API_BASE_URL.auth}/me`);
  },
  
  validateToken: async () => {
    return fetchApi(`${API_BASE_URL.auth}/validate`);
  }
};

// Delivery Service
export const deliveryService = {
  getActiveDeliveries: async () => {
    return fetchApi(`${API_BASE_URL.delivery}/active`);
  },
  
  getAvailableDeliveries: async (riderId = null) => {
    const url = riderId 
      ? `${API_BASE_URL.delivery}/available?riderId=${riderId}`
      : `${API_BASE_URL.delivery}/available`;
    return fetchApi(url);
  },
  
  getActiveDeliveriesWithOrders: async () => {
    return fetchApi(`${API_BASE_URL.delivery}/active/with-orders`);
  },
  
  getDeliveryByOrderId: async (orderId) => {
    if (USE_MOCK_DATA && mockCustomerOrderService) {
      return mockCustomerOrderService.getDeliveryByOrderId(orderId);
    }
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}`);
  },
  
  getDeliveryTracking: async (orderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/track`);
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
  
  acceptDelivery: async (orderId, riderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ riderId })
    });
  },
  
  rejectDelivery: async (orderId, riderId) => {
    return fetchApi(`${API_BASE_URL.delivery}/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ riderId })
    });
  }
};

// Rider Service
export const riderService = {
  getAllRiders: async () => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getAllRiders();
    }
    return fetchApi(API_BASE_URL.rider);
  },
  
  getAllRidersWithAvailability: async () => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getAllRiders();
    }
    return fetchApi(`${API_BASE_URL.rider}/with-availability`);
  },
  
  getRiderById: async (riderId) => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getRiderById(riderId);
    }
    return fetchApi(`${API_BASE_URL.rider}/${riderId}`);
  },
  
  getRiderByUserId: async (userId) => {
    return fetchApi(`${API_BASE_URL.rider}/byuser/${userId}`);
  },
  
  getRiderProfile: async (riderId) => {
    if (USE_MOCK_DATA && mockAdminRiderService) {
      return mockAdminRiderService.getRiderById(riderId);
    }
    
    // Validate riderId
    if (!riderId || (typeof riderId === 'number' && riderId <= 0) || (typeof riderId === 'string' && parseInt(riderId, 10) <= 0)) {
      throw new Error('Invalid rider ID. RiderId must be a positive number.');
    }
    
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/profile`);
  },
  
  getCurrentRiderProfile: async () => {
    return fetchApi(`${API_BASE_URL.rider}/profile/me`);
  },
  
  getRiderAvailability: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/availability`);
  },
  
  updateAvailability: async (riderId, isOnline, latitude = null, longitude = null) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ isOnline, latitude, longitude })
    });
  },
  
  getRiderOrders: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/orders`);
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
  
  getRiderFeedback: async (riderId) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/feedback`);
  },
  
  updateRiderProfile: async (riderId, profileData) => {
    return fetchApi(`${API_BASE_URL.rider}/${riderId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
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

// Customer Service
export const customerService = {
  getRiderInfo: async (orderId) => {
    return fetchApi(`${API_BASE_URL.customer}/${orderId}/rider`);
  },
  
  getETA: async (orderId) => {
    return fetchApi(`${API_BASE_URL.customer}/${orderId}/eta`);
  },
  
  submitFeedback: async (orderId, rating, comment) => {
    return fetchApi(`${API_BASE_URL.customer}/${orderId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  },

  // Helper: Get customerId from existing orders (workaround since we can't query Customer table directly)
  // This assumes orders exist - if not, customerId might need to match userId
  getCustomerIdFromOrders: async (userId) => {
    try {
      // Try to get all orders and find the customerId that matches
      const allOrders = await orderService.getAllOrders();
      if (Array.isArray(allOrders) && allOrders.length > 0) {
        // Find an order that might be for this user
        // We can't reliably match without Customer table access, so return userId as fallback
        console.log('[customerService] Cannot reliably determine customerId without Customer table access');
        return userId; // Fallback: use userId
      }
      return userId;
    } catch (err) {
      console.warn('[customerService] Error getting customerId from orders:', err);
      return userId; // Fallback: use userId
    }
  }
};

// Order Service
// Order Service
export const orderService = {
  getAllOrders: async () => {
    return fetchApi(`${API_BASE_URL.order}`);
  },

  getOrderById: async (orderId) => {
    if (USE_MOCK_DATA && mockCustomerOrderService) {
      return mockCustomerOrderService.getOrderById(orderId);
    }
    return fetchApi(`${API_BASE_URL.order}/${orderId}`);
  },

  getOrdersByCustomerId: async (customerId) => {
    return fetchApi(`${API_BASE_URL.order}/customer/${customerId}`);
  },

  createOrder: async (orderData) => {
    console.log('[orderService] Creating order with data:', orderData);
    return fetchApi(`${API_BASE_URL.order}`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }
};
