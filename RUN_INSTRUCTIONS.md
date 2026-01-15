# How to Run the Application - UnifiedService

## Running Backend Service

### UnifiedService (All Services on Port 5000)

Open a terminal/command prompt window:

```bash
cd Services/UnifiedService
dotnet run
```

Service will run on: **http://localhost:5000**

**All API endpoints are accessible through this single port:**
- Auth: `http://localhost:5000/api/auth/*`
- Delivery: `http://localhost:5000/api/deliveries/*`
- Rider: `http://localhost:5000/api/riders/*`
- Order: `http://localhost:5000/api/orders/*`
- Customer: `http://localhost:5000/api/customers/*`

**Swagger UI:** http://localhost:5000/swagger

---

## Running Frontend Application

### Unified Frontend App (All Roles on Port 3000)

Open a terminal/command prompt window:

```bash
cd Frontend/unified-app
npm install
npm run dev
```

Opens at `http://localhost:3000`

**All roles accessible through single app:**
- Login page with role-based routing
- Admin, Rider, and Customer all in one app
- Automatically redirects to appropriate dashboard after login

---

## Quick Start Steps

1. **Start UnifiedService:**
   ```bash
   cd Services/UnifiedService
   dotnet run
   ```
   - Service will automatically create all databases when it starts
   - Wait for: "Now listening on: http://localhost:5000"

2. **Start unified frontend application:**
   ```bash
   cd Frontend/unified-app
   npm install
   npm run dev
   ```

3. **Access the applications:**
   - Unified Frontend App: http://localhost:3000 (all roles)
   - Swagger UI: http://localhost:5000/swagger

---

## 🔐 Default Credentials

The database scripts create sample users:

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Admin | `admin` | `password123` | Admin access |
| Rider | `rider1` | `password123` | Rider access |
| Customer | `customer1` | `password123` | Customer access |

**Note:** Passwords are hashed using BCrypt. For testing, you may need to update the password hash in the database scripts or create new users via the API.

---

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

---

## 🔌 API Endpoints

All endpoints accessible at `http://localhost:5000`:

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

---

## 🗄️ Database Schema

UnifiedService uses separate databases for each domain:

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

---

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

---

## 📝 Development Notes

### Technology Stack
- **Backend:** ASP.NET Web API (.NET 8.0) - UnifiedService
- **Database:** MS SQL Server 2021+
- **ORM:** Entity Framework Core
- **Authentication:** JWT Bearer Tokens
- **Frontend:** Vite + Bootstrap 5 + React
- **API Documentation:** Swagger/OpenAPI

### Important Design Decisions
1. **UnifiedService Architecture** - All backend services consolidated into one application on port 5000
2. **Unified Frontend App** - All frontend functionality consolidated into one application on port 3000
3. **No MVC Controllers or Razor Views** - Pure Web API architecture
4. **Role-Based Routing** - Single frontend app routes to different dashboards based on user role
5. **Database per Domain** - Each domain has its own database schema (maintains separation)
6. **Single Port Access** - All APIs accessible through one port (5000) - simpler deployment
7. **JWT Authentication** - Centralized authentication with role-based authorization
8. **Modular Code Organization** - Controllers, services, and data access organized by domain

### Service Communication
- All services are unified in a single application (UnifiedService)
- Services communicate through shared database or direct method calls
- All services validate JWT tokens from Auth Service
- Frontend applications connect directly to UnifiedService on port 5000
- No API Gateway needed - direct API access simplifies the architecture

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify SQL Server is running
   - Check connection strings in `appsettings.json`
   - Ensure databases are created (UnifiedService creates them automatically)

2. **CORS Errors:**
   - UnifiedService has CORS enabled with "AllowAll" policy for development
   - For production, configure specific origins

3. **Authentication Errors:**
   - Ensure UnifiedService uses the correct JWT secret key
   - Check token expiration settings
   - Verify token is sent in Authorization header: `Bearer <token>`

4. **Port Conflicts:**
   - Backend: Change port in `Services/UnifiedService/Properties/launchSettings.json`
   - Frontend: Change port in `Frontend/unified-app/vite.config.js`
   - Update API URLs in `Frontend/unified-app/src/services/api.js` if backend port changes

---

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation and design decisions
- [API Documentation](./API_DOCUMENTATION.md) - Detailed API reference
- [HOW_TO_RUN_LOGIN.md](./HOW_TO_RUN_LOGIN.md) - Instructions for running the login page
- Database scripts are in `Database Scripts/` directory
- Swagger documentation available at `http://localhost:5000` when UnifiedService is running

---

## 🎓 Academic Use

This project is designed to be **thesis-ready** and **student-friendly**:
- Clean, well-commented code
- Clear separation of concerns
- Comprehensive documentation
- Follows best practices
- Ready for demonstration and presentation

---

## 📄 License

This project is provided as-is for educational purposes.

## 👥 Support

For issues or questions, refer to:
- Swagger documentation at `http://localhost:5000/swagger`
- API documentation in `API_DOCUMENTATION.md`
- Code comments for implementation details

---

**Built with ❤️ for microservices learning and delivery management**
