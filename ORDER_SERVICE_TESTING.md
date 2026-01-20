# OrderService Testing Guide

This guide explains how to test and validate the OrderService API endpoints using the frontend testing interface.

## Accessing the OrderService Testing Page

1. **Login as Admin:**
   - URL: `http://localhost:3000/login`
   - Username: `admin`
   - Password: `password123`

2. **Navigate to Orders Page:**
   - Direct URL: `http://localhost:3000/orders`
   - Or manually add `/orders` to the URL after logging in as admin

## Available Features

### 1. View All Orders
- **Endpoint:** `GET /api/orders`
- **UI:** Displays all orders in a table format
- **Features:**
  - Shows Order ID, Customer Info, Address, Total, Payment Method, Status, Order Date
  - Color-coded status badges
  - Responsive table with sorting
  - Real-time data refresh

### 2. Create New Order
- **Endpoint:** `POST /api/orders`
- **UI:** Modal form with all required fields
- **Required Fields:**
  - Customer ID (integer)
  - Customer Name (max 255 characters)
  - Customer Phone (max 50 characters)
  - Delivery Address (max 500 characters)
  - Order Total (decimal, minimum 0.01)
- **Optional Fields:**
  - Special Instructions (max 1000 characters)
  - Payment Method (default: COD, options: COD, Card, Online)

### 3. View Order Details
- **Endpoint:** `GET /api/orders/{id}`
- **UI:** Modal with complete order information
- **Features:**
  - Complete order details
  - Raw JSON response for debugging
  - Formatted dates and currency

## Testing Scenarios

### Test Case 1: Create a Valid Order

1. Click **"Create New Order"** button
2. Fill in the form:
   ```
   Customer ID: 1
   Customer Name: John Doe
   Customer Phone: 555-1234
   Delivery Address: 123 Main St, City, State 12345
   Order Total: 25.99
   Payment Method: COD
   ```
3. Click **"Create Order"**
4. **Expected:** Order is created, modal closes, order appears in the table

### Test Case 2: Create Order with Special Instructions

1. Click **"Create New Order"**
2. Fill required fields plus:
   ```
   Special Instructions: Please leave at front door
   ```
3. Submit
4. **Expected:** Order created with special instructions visible in details

### Test Case 3: View Order Details

1. In the orders table, click **"View Details"** on any order
2. **Expected:** Modal opens showing:
   - All order fields
   - Formatted dates and currency
   - Raw JSON response for API validation

### Test Case 4: Validate API Response Format

1. Create an order
2. View its details
3. Check the "Raw API Response" section
4. **Expected:** JSON matches the Order model structure:
   ```json
   {
     "orderId": 1,
     "customerId": 1,
     "customerName": "...",
     "customerPhone": "...",
     "deliveryAddress": "...",
     "specialInstructions": "...",
     "orderTotal": 25.99,
     "paymentMethod": "COD",
     "orderDate": "2024-01-01T00:00:00Z",
     "status": "Pending"
   }
   ```

### Test Case 5: Refresh Orders List

1. Create a new order in another browser tab or via API
2. Click **"Refresh"** button
3. **Expected:** New order appears in the list

### Test Case 6: Error Handling - Invalid Data

1. Click **"Create New Order"**
2. Submit with invalid data (e.g., negative order total)
3. **Expected:** Error message displayed, order not created

### Test Case 7: Empty State

1. Navigate to `/orders` when no orders exist
2. **Expected:** Message "No orders found. Create your first order!"

### Test Case 8: Loading State

1. Navigate to `/orders`
2. **Expected:** Loading spinner while fetching orders

## API Endpoints Tested

| Endpoint | Method | Purpose | Test Status |
|----------|--------|---------|-------------|
| `/api/orders` | GET | Get all orders | ✅ Tested |
| `/api/orders` | POST | Create new order | ✅ Tested |
| `/api/orders/{id}` | GET | Get order by ID | ✅ Tested |
| `/api/orders/customer/{customerId}` | GET | Get orders by customer | ⚠️ Not in UI (API exists) |

## Console Logging

The frontend includes comprehensive console logging:

- `[OrdersPage]` prefix for all logs
- API request/response logging
- Error logging with full error details
- State change logging

**To view logs:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Filter by `[OrdersPage]`

## Sample Test Data

### Valid Order Data
```json
{
  "customerId": 1,
  "customerName": "Jane Smith",
  "customerPhone": "555-9876",
  "deliveryAddress": "456 Oak Ave, Springfield, IL 62701",
  "specialInstructions": "Ring doorbell twice",
  "orderTotal": 45.50,
  "paymentMethod": "Card"
}
```

### Minimal Order Data (required fields only)
```json
{
  "customerId": 2,
  "customerName": "Bob Johnson",
  "customerPhone": "555-1111",
  "deliveryAddress": "789 Pine St, Chicago, IL 60601",
  "orderTotal": 19.99,
  "paymentMethod": "COD"
}
```

## Troubleshooting

### Orders Not Loading
- **Check:** Backend is running on `http://localhost:5000`
- **Check:** Browser console for API errors
- **Check:** Network tab in DevTools for failed requests

### Order Creation Fails
- **Check:** All required fields are filled
- **Check:** Order total is greater than 0
- **Check:** Customer ID is a valid integer
- **Check:** Backend logs for validation errors

### Authentication Issues
- **Ensure:** You're logged in as Admin
- **Check:** JWT token is present in localStorage
- **Check:** Token hasn't expired

## Next Steps for Extended Testing

1. **Add Order Status Updates:**
   - If backend supports status updates, add status change UI

2. **Add Customer Filter:**
   - Implement `GET /api/orders/customer/{customerId}` endpoint in UI

3. **Add Search/Filter:**
   - Filter by status, date range, customer

4. **Add Order Editing:**
   - If backend supports PUT/PATCH endpoints

## Integration with Other Services

The OrderService integrates with:
- **DeliveryService:** Orders can be assigned to deliveries
- **CustomerService:** Orders are linked to customers
- **RiderService:** Orders can be assigned to riders for delivery

**Note:** This testing interface focuses on OrderService endpoints only. For full system integration testing, use the Admin Dashboard.

---

**Last Updated:** January 2024
**Version:** 1.0
