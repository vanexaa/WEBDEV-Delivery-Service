# Delivery Management Microservice

A comprehensive delivery management system built with ASP.NET Core 9.0 Minimal APIs, providing endpoints for delivery assignment, status tracking, rider management, and customer interactions.

## 🏗️ Architecture

- **Backend**: ASP.NET Core 9.0 with Minimal APIs
- **Database**: SQL Server with Entity Framework Core
- **Frontend**: React 18 with Vite and Bootstrap 5 (separate repository)

## 📁 Project Structure

```
WEBDEV-Delivery-Service/
├── Ayawkomagbackend/
│   ├── Models/              # Entity models (Rider, Delivery, Feedback, etc.)
│   ├── Data/                # DbContext and database configuration
│   └── DTOs/                # Data Transfer Objects for API requests/responses
├── Migrations/              # EF Core database migrations
├── Program.cs               # Minimal API endpoints and configuration
└── appsettings.json        # Configuration (connection strings, etc.)
```

## 🚀 Getting Started

### Prerequisites

- .NET 9.0 SDK
- SQL Server (LocalDB or SQL Server Express/Full)
- Visual Studio 2022 or VS Code (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WEBDEV-Delivery-Service
   ```

2. **Configure Database Connection**
   - Update `appsettings.json` with your SQL Server connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=DeliveryServiceDb;Trusted_Connection=True;"
     }
   }
   ```

3. **Run Database Migrations**
   ```bash
   dotnet ef database update --project WEBDEV-Delivery-Service
   ```

4. **Run the Application**
   ```bash
   dotnet run --project WEBDEV-Delivery-Service
   ```

5. **Access Swagger UI**
   - Navigate to `http://localhost:5000/swagger` (or the port shown in your terminal)

## 📚 API Endpoints

### Delivery Assignment & Tracking

#### Assign Rider to Order
```http
POST /api/deliveries/assign
Content-Type: application/json

{
  "orderId": 1,
  "riderId": 2
}
```

#### Get Delivery Details
```http
GET /api/deliveries/{orderId}
```

#### Get Active Deliveries
```http
GET /api/deliveries/active
```

#### Reassign Delivery (Admin)
```http
PUT /api/deliveries/{orderId}/reassign
Content-Type: application/json

{
  "newRiderId": 3
}
```

### Delivery Status Management

#### Update Delivery Status
```http
PUT /api/deliveries/{orderId}/status
Content-Type: application/json

{
  "status": "PickedUp"  // Valid: PickedUp, InTransit, Delivered, Failed
}
```

#### Mark Delivery as Failed
```http
PUT /api/deliveries/{orderId}/failure
Content-Type: application/json

{
  "reason": "Customer address not found"
}
```

#### Track Delivery (ETA & Location)
```http
GET /api/deliveries/{orderId}/track
```

### Rider Management

#### Get Rider Profile
```http
GET /api/riders/{riderId}
```

#### Get Rider's Assigned Orders
```http
GET /api/riders/{riderId}/orders
```

#### Update Rider Availability
```http
PUT /api/riders/{riderId}/availability
Content-Type: application/json

{
  "isAvailable": true
}
```

#### Get Rider Delivery History
```http
GET /api/riders/{riderId}/history
```

#### Get Rider Feedback
```http
GET /api/riders/{riderId}/feedback
```

### Customer-Facing Endpoints

#### Get Rider Contact Details
```http
GET /api/customers/{orderId}/rider
```

#### Get Delivery ETA
```http
GET /api/customers/{orderId}/eta
```

#### Submit Rider Feedback
```http
POST /api/customers/{orderId}/feedback
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent service!"
}
```

## 🗄️ Database Models

### Core Entities

- **Rider**: Delivery personnel with availability status
- **Delivery**: Order delivery tracking with status history
- **Feedback**: Customer ratings and comments for riders
- **StatusHistory**: Audit trail of delivery status changes
- **DeliveryFailure**: Records of failed deliveries with reasons
- **DeliveryAssignment**: Assignment history of riders to deliveries

## 🔐 Business Rules

- Each order must be assigned to a single rider
- Riders can update order status manually (PickedUp → InTransit → Delivered/Failed)
- Admin can reassign deliveries in edge cases
- Customers can view estimated delivery time and simulated map location
- Delivery updates are manual or simulated, not real-time GPS tracking

## 🧪 Testing

### Using Swagger UI

1. Start the application
2. Navigate to `http://localhost:<port>/swagger`
3. Use the interactive UI to test all endpoints

### Using Postman/cURL

Example cURL command:
```bash
curl -X POST "http://localhost:5000/api/deliveries/assign" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "riderId": 2}'
```

## 📝 Status Values

Valid delivery statuses:
- `Pending` - Initial state
- `Assigned` - Rider assigned
- `PickedUp` - Rider picked up the order
- `InTransit` - Order is on the way
- `Delivered` - Successfully delivered
- `Failed` - Delivery failed (with reason)

## 🛠️ Development

### Adding New Endpoints

1. Create DTOs in `Ayawkomagbackend/DTOs/`
2. Add endpoint in `Program.cs` using Minimal API syntax
3. Implement validation and business logic
4. Test via Swagger UI

### Database Migrations

```bash
# Create a new migration
dotnet ef migrations add <MigrationName> --project WEBDEV-Delivery-Service

# Apply migrations
dotnet ef database update --project WEBDEV-Delivery-Service
```

## 📦 Dependencies

- `Microsoft.EntityFrameworkCore.SqlServer` - SQL Server provider
- `Microsoft.EntityFrameworkCore.Tools` - EF Core tools
- `Swashbuckle.AspNetCore` - Swagger/OpenAPI support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

-

## 🙏 Acknowledgments

- ASP.NET Core team
- Entity Framework Core team

---

**Note**: This is a microservice for delivery management. Ensure proper authentication and authorization are implemented before deploying to production.
