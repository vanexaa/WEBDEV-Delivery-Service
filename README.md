# Delivery Management System - UnifiedService Architecture

A comprehensive delivery management system built with ASP.NET Web API using a **UnifiedService** architecture for a single-restaurant setup. The system supports three user roles: **Customer**, **Rider**, and **Admin (Rider Admin)**.

## 🏗️ Architecture Overview

This system uses a **UnifiedService** approach where all services are consolidated into a single backend application running on **port 5000**. This provides:

### ✅ Benefits of Single Port (UnifiedService)

**1. Simpler Deployment**
- ✅ **One service to run instead of five** - Start a single application instead of managing multiple services
- ✅ **One port to manage (5000)** - No need to track multiple ports (5001, 5003, 5005, 5007, 5009)
- ✅ **Easier to start/stop** - Single command: `dotnet run` in UnifiedService folder

**2. Reduced Complexity**
- ✅ **No API Gateway needed** - Direct API calls from frontend to backend
- ✅ **No inter-service communication overhead** - Services communicate through shared database or direct method calls
- ✅ **Simpler networking configuration** - No need to configure service discovery, load balancing, or routing

**3. Better for Development**
- ✅ **Faster startup** - One application starts faster than five separate services
- ✅ **Easier debugging** - Single process to debug, unified logging
- ✅ **Less resource usage** - Lower memory and CPU footprint compared to multiple services

**4. Still Organized**
- ✅ **Controllers are separated by domain** - Auth, Delivery, Rider, Order, Customer controllers maintain separation of concerns
- ✅ **Each has its own database** - Separate databases for each domain (AuthServiceDB, DeliveryServiceDB, etc.)
- ✅ **Code structure remains modular** - Services, models, and data access are organized by domain

## 📦 UnifiedService Components

All services are accessible through **UnifiedService** on **port 5000**:

### 1. **Auth Service** (`/api/auth/*`)
- User authentication and authorization
- JWT token generation and validation
- Role-based access control (Customer, Rider, Admin)
- User management

**Database:** `AuthServiceDB`

### 2. **Delivery Service** (`/api/deliveries/*`)
- Delivery assignment and tracking
- Delivery status management
- Order-to-delivery mapping
- Delivery status history
- Delivery proof management

**Database:** `DeliveryServiceDB`

### 3. **Rider Service** (`/api/riders/*`)
- Rider profile management
- Rider availability (Online/Offline)
- Rider earnings tracking
- Rider feedback management
- Delivery history

**Database:** `RiderServiceDB`

### 4. **Order Service** (`/api/orders/*`)
- Order creation and management
- Order status tracking
- Customer order history

**Database:** `OrderServiceDB`

### 5. **Customer Service** (`/api/customers/*`)
- Rider information viewing
- ETA (Estimated Time of Arrival) tracking
- Feedback submission
- Order tracking integration

**Database:** `CustomerServiceDB`

> **Note:** See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🎨 Frontend Applications

Three separate frontend applications built with **Vite**, **Bootstrap 5**, and **Vanilla JavaScript**:

1. **Rider App** (Port: 3000)
   - Rider login and availability management
   - Active order viewing and management
   - Order status updates
   - Navigation integration
   - Earnings tracking
   - Customer communication

2. **Admin App** (Port: 3001)
   - Admin login
   - Dashboard with statistics
   - Rider management
   - Delivery management and assignment
   - System monitoring

3. **Customer App** (Port: 3002)
   - Customer login
   - Order tracking
   - Rider information viewing
   - ETA viewing
   - Feedback submission

## 🚀 Getting Started

### Prerequisites

- **.NET 8.0 SDK** or later
- **MS SQL Server 2021** or later
- **Node.js** 18+ and **npm**
- **Git** (optional)

### Database Setup

1. Open **SQL Server Management Studio (SSMS)** or use `sqlcmd`
2. Execute the database scripts in order:
   ```sql
   -- Run these scripts in order:
   01_AuthService_Database.sql
   02_DeliveryService_Database.sql
   03_RiderService_Database.sql
   04_CustomerService_Database.sql
   ```
3. The scripts will create all necessary databases, tables, indexes, and sample data.

### Backend Setup

1. **Navigate to UnifiedService directory:**
   ```bash
   cd Services/UnifiedService
   dotnet restore
   dotnet run
   ```

2. **UnifiedService will run on port 5000:**
   - Backend API: `http://localhost:5000`
   - Swagger UI: `http://localhost:5000` (root URL)

3. **All API endpoints are accessible through port 5000:**
   - Auth: `http://localhost:5000/api/auth/*`
   - Deliveries: `http://localhost:5000/api/deliveries/*`
   - Riders: `http://localhost:5000/api/riders/*`
   - Orders: `http://localhost:5000/api/orders/*`
   - Customers: `http://localhost:5000/api/customers/*`

### Frontend Setup

1. **Rider App:**
   ```bash
   cd Frontend/rider-app
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3001` (connects to `http://localhost:5000/api/*`)

2. **Admin App:**
   ```bash
   cd Frontend/admin-app
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3003` (connects to `http://localhost:5000/api/*`)

3. **Customer App:**
   ```bash
   cd Frontend/customer-app
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3002` (connects to `http://localhost:5000/api/*`)

4. **Login Page:**
   - Open `Frontend/login-test.html` in your browser
   - Or use: `cd Frontend && python -m http.server 8080`
   - Then open: `http://localhost:8080/login-test.html`

## 🔐 Default Credentials

The database scripts create sample users:

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Admin | `admin` | `password123` | Admin access |
| Rider | `rider1` | `password123` | Rider access |
| Customer | `customer1` | `password123` | Customer access |

**Note:** Passwords are hashed using BCrypt. For testing, you may need to update the password hash in the database scripts or create new users via the API.

## 📋 Key Features

### Rider Features
- ✅ Login and authentication
- ✅ Online/Offline availability toggle
- ✅ View assigned orders
- ✅ Accept/Decline orders
- ✅ Update delivery status (Accepted, Picked Up, In Transit, Delivered, Failed)
- ✅ Navigate to customer address (Google Maps integration)
- ✅ Call customer directly
- ✅ View earnings and delivery history
- ✅ View feedback

### Admin Features
- ✅ Login and authentication
- ✅ Dashboard with statistics
- ✅ View all riders and their availability
- ✅ View all deliveries
- ✅ Assign/reassign deliveries to riders
- ✅ Mark deliveries as failed
- ✅ Monitor system status

### Customer Features
- ✅ Login and authentication
- ✅ Track order by Order ID
- ✅ View delivery status and timeline
- ✅ View rider information
- ✅ View ETA
- ✅ Call rider directly
- ✅ Submit feedback and rating

## 🔌 API Endpoints

All endpoints are accessible through **UnifiedService** at `http://localhost:5000`:

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Quick Reference

**Base URL:** `http://localhost:5000`

**Auth Service** (`/api/auth/*`):
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/validate` - Validate token

**Delivery Service** (`/api/deliveries/*`):
- `POST /api/deliveries/assign` - Assign delivery (Admin)
- `GET /api/deliveries/{orderId}` - Get delivery by order ID
- `GET /api/deliveries/active` - Get active deliveries
- `PUT /api/deliveries/{orderId}/status` - Update delivery status
- `PUT /api/deliveries/{orderId}/reassign` - Reassign delivery (Admin)
- `GET /api/deliveries/{orderId}/track` - Track delivery

**Rider Service** (`/api/riders/*`):
- `GET /api/riders` - Get all riders
- `GET /api/riders/{riderId}` - Get rider details
- `GET /api/riders/{riderId}/profile` - Get rider profile
- `GET /api/riders/{riderId}/availability` - Get availability
- `PUT /api/riders/{riderId}/availability` - Update availability
- `GET /api/riders/{riderId}/history` - Get delivery history
- `GET /api/riders/{riderId}/feedback` - Get feedback

**Order Service** (`/api/orders/*`):
- `POST /api/orders` - Create order
- `GET /api/orders/{orderId}` - Get order by ID
- `GET /api/orders/customer/{customerId}` - Get orders by customer

**Customer Service** (`/api/customers/*`):
- `GET /api/customers/{orderId}/rider` - Get rider info
- `GET /api/customers/{orderId}/eta` - Get ETA
- `POST /api/customers/{orderId}/feedback` - Submit feedback

## 🗄️ Database Schema

Each microservice has its own database:

### AuthServiceDB
- `Users` - User accounts and roles
- `RefreshTokens` - Refresh token management

### DeliveryServiceDB
- `Orders` - Order information
- `Deliveries` - Delivery records
- `DeliveryStatusHistory` - Status change history
- `DeliveryProof` - Delivery proof (photos, OTP, signatures)

### RiderServiceDB
- `Riders` - Rider profiles
- `RiderAvailability` - Rider online/offline status
- `RiderEarnings` - Earnings records
- `RiderFeedback` - Customer feedback for riders

### CustomerServiceDB
- `Customers` - Customer profiles
- `CustomerOrders` - Customer order references

### OrderServiceDB
- `Orders` - Order information and status

## 🔧 Configuration

### Connection Strings
Update connection strings in `Services/UnifiedService/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "AuthConnection": "Server=localhost;Database=AuthServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "DeliveryConnection": "Server=localhost;Database=DeliveryServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "RiderConnection": "Server=localhost;Database=RiderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "OrderConnection": "Server=localhost;Database=OrderServiceDB;Trusted_Connection=True;TrustServerCertificate=True;",
    "CustomerConnection": "Server=localhost;Database=CustomerServiceDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### JWT Settings
JWT configuration is in `Services/UnifiedService/appsettings.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJWTTokenGeneration2024!MustBeAtLeast32Characters",
    "Issuer": "AuthService",
    "Audience": "DeliveryService",
    "ExpiryInMinutes": 60
  }
}
```

## 📝 Development Notes

### Technology Stack
- **Backend:** ASP.NET Web API (.NET 8.0)
- **Database:** MS SQL Server 2021+
- **ORM:** Entity Framework Core
- **Authentication:** JWT Bearer Tokens
- **Frontend:** Vite + Bootstrap 5 + Vanilla JavaScript
- **API Documentation:** Swagger/OpenAPI

### Important Design Decisions
1. **UnifiedService Architecture** - All backend services consolidated into one application on port 5000
2. **No MVC Controllers or Razor Views** - Pure Web API architecture
3. **Separate Frontend Apps** - Each role has its own frontend application
4. **Database per Domain** - Each domain has its own database schema (maintains separation)
5. **Single Port Access** - All APIs accessible through one port (5000) - simpler deployment
6. **JWT Authentication** - Centralized authentication with role-based authorization
7. **Modular Code Organization** - Controllers, services, and data access organized by domain

### Service Communication
- All services are unified in a single application (UnifiedService)
- Services communicate through shared database or direct method calls
- All services validate JWT tokens from Auth Service
- Frontend applications connect directly to UnifiedService on port 5000
- No API Gateway needed - direct API access simplifies the architecture

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify SQL Server is running
   - Check connection strings in `appsettings.json`
   - Ensure databases are created

2. **CORS Errors:**
   - All services have CORS enabled with "AllowAll" policy for development
   - For production, configure specific origins

3. **Authentication Errors:**
   - Ensure all services use the same JWT secret key
   - Check token expiration settings
   - Verify token is sent in Authorization header: `Bearer <token>`

4. **Port Conflicts:**
   - Backend: Change port in `Services/UnifiedService/Properties/launchSettings.json`
   - Frontend: Change ports in `vite.config.js` for each app
   - Update API URLs in frontend `src/services/api.js` files if backend port changes

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation and design decisions
- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- [HOW_TO_RUN_LOGIN.md](./HOW_TO_RUN_LOGIN.md) - Instructions for running the login page
- Database scripts are in `Database Scripts/` directory
- Swagger documentation available at `http://localhost:5000` when UnifiedService is running

## 🎓 Academic Use

This project is designed to be **thesis-ready** and **student-friendly**:
- Clean, well-commented code
- Clear separation of concerns
- Comprehensive documentation
- Follows best practices
- Ready for demonstration and presentation

## 📄 License

This project is provided as-is for educational purposes.

## 👥 Support

For issues or questions, refer to:
- Swagger documentation at `/swagger` for each service
- API documentation in `API_DOCUMENTATION.md`
- Code comments for implementation details

---

**Built with ❤️ for microservices learning and delivery management**
