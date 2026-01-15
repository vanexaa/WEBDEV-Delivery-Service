# Architecture Overview - UnifiedService

## Design Decision: Single Port Architecture

This project uses a **UnifiedService** approach where all microservices are consolidated into a single backend service running on **port 5000**. This is a practical architectural choice that balances simplicity with maintainability.

## Benefits of Single Port (UnifiedService)

### 1. Simpler Deployment
- ✅ **One service to run instead of five** - Start a single application instead of managing multiple services
- ✅ **One port to manage (5000)** - No need to track multiple ports (5001, 5003, 5005, 5007, 5009)
- ✅ **Easier to start/stop** - Single command: `dotnet run` in UnifiedService folder

### 2. Reduced Complexity
- ✅ **No API Gateway needed** - Direct API calls from frontend to backend
- ✅ **No inter-service communication overhead** - Services communicate through shared database or direct method calls
- ✅ **Simpler networking configuration** - No need to configure service discovery, load balancing, or routing

### 3. Better for Development
- ✅ **Faster startup** - One application starts faster than five separate services
- ✅ **Easier debugging** - Single process to debug, unified logging
- ✅ **Less resource usage** - Lower memory and CPU footprint compared to multiple services

### 4. Still Organized
- ✅ **Controllers are separated by domain** - Auth, Delivery, Rider, Order, Customer controllers maintain separation of concerns
- ✅ **Each has its own database** - Separate databases for each domain (AuthServiceDB, DeliveryServiceDB, etc.)
- ✅ **Code structure remains modular** - Services, models, and data access are organized by domain

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              UnifiedService (Port 5000)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Auth         │  │ Delivery    │  │ Rider        │ │
│  │ Controller   │  │ Controller  │  │ Controller   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ Order        │  │ Customer     │                    │
│  │ Controller   │  │ Controller  │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Shared Services Layer                  │  │
│  │  - AuthService, DeliveryService, RiderService   │  │
│  │  - OrderService, CustomerService                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Data Access Layer                       │  │
│  │  - AuthDbContext, DeliveryDbContext              │  │
│  │  - RiderDbContext, OrderDbContext                │  │
│  │  - CustomerDbContext                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
   │ Auth    │      │ Delivery  │    │ Rider     │
   │ Service │      │ Service   │    │ Service   │
   │ DB      │      │ DB        │    │ DB        │
   └─────────┘      └───────────┘    └───────────┘
        │                 │                 │
   ┌────▼────┐      ┌─────▼─────┐
   │ Order   │      │ Customer  │
   │ Service │      │ Service   │
   │ DB      │      │ DB        │
   └─────────┘      └───────────┘
```

## API Endpoints

All endpoints are accessible through `http://localhost:5000`:

- **Authentication**: `/api/auth/*`
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Get current user
  - `GET /api/auth/validate` - Validate token

- **Deliveries**: `/api/deliveries/*`
  - `GET /api/deliveries/active` - Get active deliveries
  - `POST /api/deliveries/assign` - Assign delivery to rider
  - `PUT /api/deliveries/{orderId}/status` - Update delivery status
  - `GET /api/deliveries/{orderId}/track` - Track delivery

- **Riders**: `/api/riders/*`
  - `GET /api/riders` - Get all riders
  - `GET /api/riders/{riderId}` - Get rider by ID
  - `PUT /api/riders/{riderId}/availability` - Update availability
  - `GET /api/riders/{riderId}/history` - Get earnings history

- **Orders**: `/api/orders/*`
  - `POST /api/orders` - Create order
  - `GET /api/orders/{orderId}` - Get order by ID
  - `GET /api/orders/customer/{customerId}` - Get orders by customer

- **Customers**: `/api/customers/*`
  - `GET /api/customers/{orderId}/rider` - Get rider info for order
  - `GET /api/customers/{orderId}/eta` - Get estimated arrival time
  - `POST /api/customers/{orderId}/feedback` - Submit feedback

## Frontend Integration

All frontend applications connect to the unified service:

- **Admin App** → `http://localhost:5000/api/*`
- **Rider App** → `http://localhost:5000/api/*`
- **Customer App** → `http://localhost:5000/api/*`
- **Login Page** → `http://localhost:5000/api/auth/*`

## Database Structure

Each domain maintains its own database:

- `AuthServiceDB` - User authentication and authorization
- `DeliveryServiceDB` - Delivery tracking and status
- `RiderServiceDB` - Rider profiles, availability, earnings
- `OrderServiceDB` - Order management
- `CustomerServiceDB` - Customer operations and feedback

## When to Consider True Microservices

This unified approach works well for:
- ✅ Small to medium-sized applications
- ✅ Teams that work together on all services
- ✅ Applications where services are tightly coupled
- ✅ Development and testing environments

Consider splitting into separate microservices if:
- ❌ Services need independent scaling
- ❌ Different teams own different services
- ❌ Services have different deployment schedules
- ❌ You need service-level isolation for security/compliance

## Running the Service

```bash
# Navigate to UnifiedService
cd Services\UnifiedService

# Run the service
dotnet run

# Service will start on http://localhost:5000
# Swagger UI available at http://localhost:5000
```

## Configuration

All configuration is in `appsettings.json`:
- Connection strings for all databases
- JWT settings for authentication
- Service URLs (all pointing to localhost:5000)

## Benefits Summary

| Aspect | UnifiedService (Current) | Separate Microservices |
|--------|-------------------------|----------------------|
| **Deployment** | Single service | Multiple services |
| **Ports** | 1 port (5000) | 5 ports (5001, 5003, 5005, 5007, 5009) |
| **Startup Time** | Fast (~2-3 seconds) | Slower (~10-15 seconds) |
| **Resource Usage** | Lower | Higher |
| **Complexity** | Lower | Higher |
| **Scalability** | Service-level | Component-level |
| **Development** | Easier | More complex |

For this delivery service application, the unified approach provides the best balance of simplicity, maintainability, and functionality.
