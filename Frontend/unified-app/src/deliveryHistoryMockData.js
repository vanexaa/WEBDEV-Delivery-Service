// Shared mock data for delivery history across rider and admin apps

// Mock riders data
const mockRiders = [
  { riderId: 1, fullName: 'John Doe', phoneNumber: '09123456789', vehicleType: 'Motorcycle', vehicleNumber: 'ABC-1234', isOnline: true },
  { riderId: 2, fullName: 'Jane Smith', phoneNumber: '09987654321', vehicleType: 'Bicycle', vehicleNumber: 'XYZ-5678', isOnline: false },
  { riderId: 3, fullName: 'Mike Johnson', phoneNumber: '09555123456', vehicleType: 'Motorcycle', vehicleNumber: 'DEF-9012', isOnline: true }
];

// Mock delivery history data
const mockDeliveryHistory = [
  {
    deliveryId: 1,
    riderId: 1,
    transactionCode: 'TXN-001',
    status: 'Delivered',
    assignedAt: '2024-01-10T10:00:00Z',
    deliveredAt: '2024-01-10T11:30:00Z',
    order: {
      orderId: 1,
      transactionCode: 'TXN-001',
      customerName: 'Alice Brown',
      deliveryAddress: '123 Main St, City, Country',
      orderTotal: 45.50,
      paymentMethod: 'Online Payment',
      orderDate: '2024-01-10T09:00:00Z'
    }
  },
  {
    deliveryId: 2,
    riderId: 1,
    transactionCode: 'TXN-002',
    status: 'Delivered',
    assignedAt: '2024-01-11T14:00:00Z',
    deliveredAt: '2024-01-11T15:20:00Z',
    order: {
      orderId: 2,
      transactionCode: 'TXN-002',
      customerName: 'Bob Wilson',
      deliveryAddress: '456 Oak Ave, City, Country',
      orderTotal: 32.75,
      paymentMethod: 'Online Payment',
      orderDate: '2024-01-11T13:00:00Z'
    }
  },
  {
    deliveryId: 3,
    riderId: 2,
    transactionCode: 'TXN-003',
    status: 'InTransit',
    assignedAt: '2024-01-12T09:00:00Z',
    deliveredAt: null,
    order: {
      orderId: 3,
      transactionCode: 'TXN-003',
      customerName: 'Carol Davis',
      deliveryAddress: '789 Pine Rd, City, Country',
      orderTotal: 67.25,
      paymentMethod: 'Online Payment',
      orderDate: '2024-01-12T08:00:00Z'
    }
  },
  {
    deliveryId: 4,
    riderId: 1,
    transactionCode: 'TXN-004',
    status: 'Delivered',
    assignedAt: '2024-01-13T10:30:00Z',
    deliveredAt: '2024-01-13T12:00:00Z',
    order: {
      orderId: 4,
      transactionCode: 'TXN-004',
      customerName: 'David Lee',
      deliveryAddress: '321 Elm St, City, Country',
      orderTotal: 89.90,
      paymentMethod: 'Online Payment',
      orderDate: '2024-01-13T09:30:00Z'
    }
  },
  {
    deliveryId: 5,
    riderId: 3,
    transactionCode: 'TXN-005',
    status: 'PickedUp',
    assignedAt: '2024-01-14T08:00:00Z',
    deliveredAt: null,
    order: {
      orderId: 5,
      transactionCode: 'TXN-005',
      customerName: 'Emma White',
      deliveryAddress: '654 Maple Dr, City, Country',
      orderTotal: 55.00,
      paymentMethod: 'Online Payment',
      orderDate: '2024-01-14T07:00:00Z'
    }
  }
];

// Helper function to calculate ETA
const calculateETA = (delivery) => {
  if (!delivery.assignedAt) return null;
  const assigned = new Date(delivery.assignedAt);
  const now = new Date();
  const elapsed = now - assigned;
  const estimatedTotal = 90 * 60 * 1000; // 90 minutes in milliseconds
  const remaining = Math.max(0, estimatedTotal - elapsed);
  const eta = new Date(now.getTime() + remaining);
  return {
    estimatedTime: Math.ceil(remaining / (60 * 1000)), // minutes
    estimatedArrival: eta.toISOString()
  };
};

// Mock Rider History Service
export const mockRiderHistoryService = {
  getRiderHistory: async (riderId, startDate = null, endDate = null) => {
    let filtered = mockDeliveryHistory.filter(d => d.riderId === riderId);
    
    if (startDate || endDate) {
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.assignedAt);
        if (startDate && deliveryDate < startDate) return false;
        if (endDate && deliveryDate > endDate) return false;
        return true;
      });
    }
    
    return filtered;
  },
  
  getRiderOnlinePayments: async (riderId, startDate = null, endDate = null) => {
    let filtered = mockDeliveryHistory.filter(d => 
      d.riderId === riderId && 
      d.status === 'Delivered' &&
      d.order?.paymentMethod === 'Online Payment'
    );
    
    if (startDate || endDate) {
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.assignedAt);
        if (startDate && deliveryDate < startDate) return false;
        if (endDate && deliveryDate > endDate) return false;
        return true;
      });
    }
    
    const totalOnlinePayments = filtered.reduce((sum, d) => sum + (d.order?.orderTotal || 0), 0);
    return {
      totalOnlinePayments,
      transactionCount: filtered.length
    };
  }
};

// Mock Admin Rider Service
export const mockAdminRiderService = {
  getAllRiders: async () => {
    return mockRiders;
  },
  
  getRiderHistory: async (riderId, startDate = null, endDate = null) => {
    return mockRiderHistoryService.getRiderHistory(riderId, startDate, endDate);
  },
  
  getAllDeliveryHistory: async () => {
    return mockDeliveryHistory;
  }
};

// Mock Customer Order Service
export const mockCustomerOrderService = {
  getOrderById: async (transactionCode) => {
    const delivery = mockDeliveryHistory.find(d => d.transactionCode === transactionCode);
    return delivery?.order || null;
  },
  
  getOrdersByCustomerId: async (customerId) => {
    // For mock data, return all orders (in real app, filter by customerId)
    return mockDeliveryHistory.map(d => d.order).filter(Boolean);
  },
  
  getDeliveryByOrderId: async (transactionCode) => {
    return mockDeliveryHistory.find(d => d.transactionCode === transactionCode) || null;
  },
  
  getRiderInfo: async (transactionCode) => {
    const delivery = mockDeliveryHistory.find(d => d.transactionCode === transactionCode);
    if (!delivery) return null;
    const rider = mockRiders.find(r => r.riderId === delivery.riderId);
    return rider ? {
      riderId: rider.riderId,
      fullName: rider.fullName,
      phoneNumber: rider.phoneNumber,
      vehicleType: rider.vehicleType,
      vehicleNumber: rider.vehicleNumber
    } : null;
  },
  
  getETA: async (transactionCode) => {
    const delivery = mockDeliveryHistory.find(d => d.transactionCode === transactionCode);
    if (!delivery) return null;
    return calculateETA(delivery);
  },
  
  submitFeedback: async (transactionCode, rating, comment) => {
    // Mock implementation - just return success
    return { success: true, message: 'Feedback submitted successfully' };
  }
};
