# Microservices-Based Delivery Management System

A comprehensive delivery management system built with ASP.NET Web API microservices architecture for a single-restaurant setup. The system supports three user roles: **Customer**, **Rider**, and **Admin (Rider Admin)**.

## 🏗️ Architecture Overview

This system follows a **microservices architecture** pattern where each service:
- Has its own database schema
- Can be deployed independently
- Communicates via REST APIs (JSON)
- Uses JWT-based authentication with role-based access control

## 📦 Microservices

### 1. **Auth Service** (Port: 5001/5002)
- User authentication and authorization
- JWT token generation and validation
- Role-based access control (Customer, Rider, Admin)
- User management

**Database:** `AuthServiceDB`

### 2. **Delivery Service** (Port: 5003/5004)
- Delivery assignment and tracking
- Delivery status management
- Order-to-delivery mapping
- Delivery status history
- Delivery proof management

**Database:** `DeliveryServiceDB`

### 3. **Rider Service** (Port: 5005/5006)
- Rider profile management
- Rider availability (Online/Offline)
- Rider earnings tracking
- Rider feedback management
- Delivery history

**Database:** `RiderServiceDB`

### 4. **Customer Service** (Port: 5007/5008)
- Rider information viewing
- ETA (Estimated Time of Arrival) tracking
- Feedback submission
- Order tracking integration

**Database:** `CustomerServiceDB`

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

1. **Navigate to each service directory:**
   ```bash
   cd Services/AuthService
   dotnet restore
   dotnet run
   ```
   Repeat for:
   - `Services/DeliveryService`
   - `Services/RiderService`
   - `Services/CustomerService`

2. **Each service will run on its designated port:**
   - Auth Service: `http://localhost:5001` (HTTP) / `https://localhost:5002` (HTTPS)
   - Delivery Service: `http://localhost:5003` (HTTP) / `https://localhost:5004` (HTTPS)
   - Rider Service: `http://localhost:5005` (HTTP) / `https://localhost:5006` (HTTPS)
   - Customer Service: `http://localhost:5007` (HTTP) / `https://localhost:5008` (HTTPS)

3. **Access Swagger documentation:**
   - Each service provides Swagger UI at `/swagger`
   - Example: `http://localhost:5001/swagger`

### Frontend Setup

1. **Rider App:**
   ```bash
   cd Frontend/rider-app
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3000`

2. **Admin App:**
   ```bash
   cd Frontend/admin-app
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3001`

3. **Customer App:**
   ```bash
   cd Frontend/customer-app
   npm install
   npm run dev
   ```
   Opens at `http://localhost:3002`

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

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Quick Reference

**Auth Service:**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/validate` - Validate token

**Delivery Service:**
- `POST /api/deliveries/assign` - Assign delivery (Admin)
- `GET /api/deliveries/{orderId}` - Get delivery by order ID
- `GET /api/deliveries/active` - Get active deliveries
- `PUT /api/deliveries/{orderId}/status` - Update delivery status
- `PUT /api/deliveries/{orderId}/reassign` - Reassign delivery (Admin)
- `GET /api/deliveries/{orderId}/track` - Track delivery

**Rider Service:**
- `GET /api/riders/{riderId}` - Get rider details
- `GET /api/riders/{riderId}/profile` - Get rider profile
- `GET /api/riders/{riderId}/availability` - Get availability
- `PUT /api/riders/{riderId}/availability` - Update availability
- `GET /api/riders/{riderId}/orders` - Get rider orders
- `GET /api/riders/{riderId}/history` - Get delivery history
- `GET /api/riders/{riderId}/feedback` - Get feedback

**Customer Service:**
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

## 🔧 Configuration

### Connection Strings
Update connection strings in each service's `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=YourDatabase;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### JWT Settings
All services share JWT configuration. Update in `appsettings.json`:

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
1. **No MVC Controllers or Razor Views** - Pure Web API architecture
2. **Separate Frontend Apps** - Each role has its own frontend application
3. **Database per Service** - Each microservice has its own database schema
4. **REST API Communication** - Services communicate via HTTP REST APIs
5. **JWT Authentication** - Centralized authentication with distributed authorization

### Service Communication
- Services communicate via HTTP REST APIs
- Customer Service calls Delivery Service and Rider Service
- All services validate JWT tokens from Auth Service
- In production, consider using API Gateway or Service Mesh

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
   - Change ports in `Properties/launchSettings.json` for backend
   - Change ports in `vite.config.js` for frontend

## 📚 Additional Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- Database scripts are in `Database Scripts/` directory
- Each service includes Swagger documentation

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
