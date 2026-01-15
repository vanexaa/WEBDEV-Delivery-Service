# API Documentation

Complete API reference for the Delivery Management System microservices.

## Base URLs

All services are accessible through **UnifiedService** on port 5000:
- **Base URL:** `http://localhost:5000/api`
- **Auth:** `http://localhost:5000/api/auth`
- **Delivery:** `http://localhost:5000/api/deliveries`
- **Rider:** `http://localhost:5000/api/riders`
- **Order:** `http://localhost:5000/api/orders`
- **Customer:** `http://localhost:5000/api/customers`

## Authentication

All endpoints (except login) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Service (`/api/auth/*`)

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "rider1",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "guid-refresh-token",
  "expiresAt": "2024-01-01T12:00:00Z",
  "user": {
    "userId": 1,
    "username": "rider1",
    "email": "rider1@restaurant.com",
    "role": "Rider"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid username or password"
}
```

### GET /auth/me
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "userId": 1,
  "username": "rider1",
  "email": "rider1@restaurant.com",
  "role": "Rider"
}
```

### GET /auth/validate
Validate JWT token.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "isValid": true,
  "userId": "1",
  "username": "rider1",
  "role": "Rider"
}
```

---

## Delivery Service (`/api/deliveries/*`)

### POST /deliveries/assign
Assign a delivery to a rider (Admin only).

**Headers:**
- `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "orderId": 123,
  "riderId": 1
}
```

**Response (200 OK):**
```json
{
  "deliveryId": 1,
  "orderId": 123,
  "riderId": 1,
  "status": "Assigned",
  "assignedAt": "2024-01-01T10:00:00Z",
  "order": {
    "orderId": 123,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "deliveryAddress": "123 Main St, City, State"
  }
}
```

### GET /deliveries/{orderId}
Get delivery information by order ID.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "deliveryId": 1,
  "orderId": 123,
  "riderId": 1,
  "status": "Assigned",
  "order": {
    "orderId": 123,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "deliveryAddress": "123 Main St, City, State",
    "specialInstructions": "Ring doorbell twice"
  }
}
```

### GET /deliveries/active
Get all active deliveries (Rider/Admin).

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  {
    "deliveryId": 1,
    "orderId": 123,
    "riderId": 1,
    "status": "InTransit",
    "assignedAt": "2024-01-01T10:00:00Z"
  }
]
```

### PUT /deliveries/{orderId}/status
Update delivery status (Rider/Admin).

**Headers:**
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "PickedUp",
  "notes": "Order picked up from restaurant",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Valid Status Values:**
- `Accepted`
- `PickedUp`
- `InTransit`
- `Delivered`
- `Failed`

**Response (200 OK):**
```json
{
  "deliveryId": 1,
  "orderId": 123,
  "status": "PickedUp",
  "pickedUpAt": "2024-01-01T10:30:00Z"
}
```

### PUT /deliveries/{orderId}/reassign
Reassign delivery to another rider (Admin only).

**Headers:**
- `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "riderId": 2
}
```

**Response (200 OK):**
```json
{
  "deliveryId": 1,
  "orderId": 123,
  "riderId": 2,
  "status": "Assigned"
}
```

### PUT /deliveries/{orderId}/failure
Mark delivery as failed (Rider/Admin).

**Headers:**
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "reason": "Customer unreachable"
}
```

**Response (200 OK):**
```json
{
  "deliveryId": 1,
  "orderId": 123,
  "status": "Failed",
  "failureReason": "Customer unreachable",
  "failedAt": "2024-01-01T11:00:00Z"
}
```

### GET /deliveries/{orderId}/track
Get delivery tracking information.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "deliveryId": 1,
  "orderId": 123,
  "riderId": 1,
  "status": "InTransit",
  "estimatedTime": "30 minutes",
  "statusHistory": [
    {
      "status": "Assigned",
      "timestamp": "2024-01-01T10:00:00Z",
      "notes": null
    },
    {
      "status": "Accepted",
      "timestamp": "2024-01-01T10:05:00Z",
      "notes": "Rider accepted the order"
    }
  ]
}
```

---

## Rider Service (`/api/riders/*`)

### GET /riders/{riderId}
Get rider information.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "riderId": 1,
  "userId": 2,
  "fullName": "John Rider",
  "phoneNumber": "+1234567890",
  "email": "rider@example.com",
  "vehicleType": "Motorcycle",
  "vehicleNumber": "ABC-123",
  "isActive": true
}
```

### GET /riders/{riderId}/profile
Get rider profile with statistics.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "riderId": 1,
  "fullName": "John Rider",
  "phoneNumber": "+1234567890",
  "email": "rider@example.com",
  "vehicleType": "Motorcycle",
  "vehicleNumber": "ABC-123",
  "isOnline": true,
  "totalEarnings": 1250.50,
  "totalDeliveries": 45,
  "averageRating": 4.5
}
```

### GET /riders/{riderId}/availability
Get rider availability status.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "availabilityId": 1,
  "riderId": 1,
  "isOnline": true,
  "currentLatitude": 40.7128,
  "currentLongitude": -74.0060,
  "lastSeen": "2024-01-01T12:00:00Z"
}
```

### PUT /riders/{riderId}/availability
Update rider availability (Rider only).

**Headers:**
- `Authorization: Bearer <rider_token>`

**Request:**
```json
{
  "isOnline": true,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (200 OK):**
```json
{
  "availabilityId": 1,
  "riderId": 1,
  "isOnline": true,
  "currentLatitude": 40.7128,
  "currentLongitude": -74.0060,
  "lastSeen": "2024-01-01T12:00:00Z"
}
```

### GET /riders/{riderId}/orders
Get rider's assigned orders.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  {
    "deliveryId": 1,
    "orderId": 123,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "deliveryAddress": "123 Main St",
    "status": "InTransit",
    "assignedAt": "2024-01-01T10:00:00Z"
  }
]
```

### GET /riders/{riderId}/history
Get rider delivery history/earnings.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Response (200 OK):**
```json
[
  {
    "earningId": 1,
    "riderId": 1,
    "deliveryId": 1,
    "orderId": 123,
    "amount": 25.50,
    "commissionRate": 10.00,
    "earningDate": "2024-01-01T11:00:00Z",
    "status": "Paid"
  }
]
```

### GET /riders/{riderId}/feedback
Get rider feedback.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  {
    "feedbackId": 1,
    "riderId": 1,
    "deliveryId": 1,
    "orderId": 123,
    "rating": 5,
    "comment": "Excellent service!",
    "customerId": 1,
    "createdAt": "2024-01-01T11:30:00Z"
  }
]
```

---

## Customer Service (`/api/customers/*`)

### GET /customers/{orderId}/rider
Get rider information for an order.

**Headers:**
- `Authorization: Bearer <customer_token>`

**Response (200 OK):**
```json
{
  "riderId": 1,
  "fullName": "John Rider",
  "phoneNumber": "+1234567890",
  "vehicleType": "Motorcycle"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Rider information not found for this order"
}
```

### GET /customers/{orderId}/eta
Get estimated time of arrival for an order.

**Headers:**
- `Authorization: Bearer <customer_token>`

**Response (200 OK):**
```json
{
  "orderId": 123,
  "estimatedTime": 30,
  "status": "InTransit",
  "estimatedArrival": "2024-01-01T12:30:00Z"
}
```

### POST /customers/{orderId}/feedback
Submit feedback for a delivery.

**Headers:**
- `Authorization: Bearer <customer_token>`

**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent delivery service!"
}
```

**Response (200 OK):**
```json
{
  "message": "Feedback submitted successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Rating must be between 1 and 5"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "An error occurred"
}
```

---

## Notes

1. **JWT Token Expiration:** Tokens expire after 60 minutes by default. Implement refresh token logic for production.

2. **Role-Based Access:**
   - Admin: Full access to all endpoints
   - Rider: Access to rider-specific endpoints and assigned deliveries
   - Customer: Access to customer-specific endpoints and own orders

3. **CORS:** All services have CORS enabled for development. Configure specific origins for production.

4. **Rate Limiting:** Consider implementing rate limiting for production use.

5. **API Versioning:** Consider adding API versioning (e.g., `/api/v1/`) for future compatibility.

---

For interactive API testing, use Swagger UI at `/swagger` endpoint of each service.
