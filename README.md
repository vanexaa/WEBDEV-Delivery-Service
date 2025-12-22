# Delivery Service Microservice

A complete microservice for managing deliveries, riders, and customer feedback for a Coffee Shop system.

## Architecture

- **Backend**: ASP.NET Core 9.0 with Minimal APIs
- **Database**: SQL Server with Entity Framework Core
- **Frontend**: React 18 with Vite and Bootstrap 5

## Project Structure

```
.
├── DeliveryService/          # ASP.NET Core Backend
│   ├── Models/              # Entity models
│   ├── Data/                # DbContext
│   ├── DTOs/                # Data Transfer Objects
│   └── Program.cs           # Minimal API endpoints
├── delivery-frontend/        # React Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   └── services/        # API service layer
│   └── package.json
└── database/
    └── schema.sql           # Database schema script
```

## Prerequisites

- .NET 9.0 SDK
- SQL Server (LocalDB or SQL Server Express)
- Node.js 18+ and npm

## Setup Instructions

### 1. Database Setup

1. Open SQL Server Management Studio (SSMS) or use `sqlcmd`
2. Run the script `database/schema.sql` to create the database and tables
3. Verify the database `DeliveryServiceDB` is created with sample data

### 2. Backend Setup

1. Navigate to the `DeliveryService` directory:
   ```bash
   cd DeliveryService
   ```

2. Restore packages:
   ```bash
   dotnet restore
   ```

3. Update the connection string in `appsettings.json` if needed:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=DeliveryServiceDB;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```

4. Run the backend:
   ```bash
   dotnet run
   ```

   The API will be available at `http://localhost:5000` (or `https://localhost:5001`)

5. Swagger UI will be available at `http://localhost:5000/swagger`

### 3. Frontend Setup

1. Navigate to the `delivery-frontend` directory:
   ```bash
   cd delivery-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## API Endpoints

### Delivery Management

- `POST /api/deliveries/assign` - Assign a delivery to a rider
- `GET /api/deliveries/{orderId}` - Get delivery details
- `GET /api/deliveries/active` - Get all active deliveries
- `PUT /api/deliveries/{orderId}/reassign` - Reassign delivery to another rider
- `PUT /api/deliveries/{orderId}/status` - Update delivery status
- `PUT /api/deliveries/{orderId}/failure` - Report delivery failure
- `GET /api/deliveries/{orderId}/track` - Track delivery location

### Rider Management

- `GET /api/riders/{riderId}` - Get rider profile
- `GET /api/riders/{riderId}/orders` - Get rider's active orders
- `PUT /api/riders/{riderId}/availability` - Toggle rider availability
- `GET /api/riders/{riderId}/history` - Get rider's delivery history
- `GET /api/riders/{riderId}/feedback` - Get rider's feedback ratings

### Customer Facing

- `GET /api/customers/{orderId}/rider` - Get rider contact information
- `GET /api/customers/{orderId}/eta` - Get estimated arrival time
- `POST /api/customers/{orderId}/feedback` - Submit delivery feedback

## Frontend Views

### 1. Customer Tracking View (`/`)
- Enter Order ID to track delivery
- View delivery status with progress bar
- See rider information and contact details
- View simulated map location
- Submit feedback after delivery

### 2. Rider Dashboard (`/rider`)
- Toggle online/offline status
- View assigned active orders
- Update order status (Pickup, Start Transit, Mark Delivered)
- Report delivery failures
- Navigate to delivery location

### 3. Admin Dispatch (`/admin`)
- View all active deliveries in a table
- See rider availability status
- Reassign deliveries to different riders
- Monitor delivery statuses and ETAs

## Business Rules

1. **Rider Availability**: Riders cannot accept new orders when offline
2. **ETA Generation**: When status changes to "InTransit", a random ETA (15-30 minutes) is generated
3. **Feedback**: Can only be submitted for delivered orders, one feedback per delivery
4. **Status Flow**: Assigned → PickedUp → InTransit → Delivered (or Failed/Cancelled)

## Sample Data

The database script includes sample data:
- 3 Riders (John Rider, Sarah Driver, Mike Courier)
- 2 Sample Deliveries (ORD-001, ORD-002)

## Testing the Application

1. **Test Customer Tracking**:
   - Navigate to Customer Tracking view
   - Enter Order ID: `ORD-001` or `ORD-002`
   - View delivery status and rider information

2. **Test Rider Dashboard**:
   - Navigate to Rider Dashboard
   - Set Rider ID to `1`, `2`, or `3`
   - Toggle availability and update order statuses

3. **Test Admin Dispatch**:
   - Navigate to Admin Dispatch
   - View active deliveries
   - Reassign deliveries to different riders

## Notes

- The map integration uses placeholder images and Google Maps links
- Location coordinates are simulated (stored as strings in format "lat,lng")
- CORS is configured to allow requests from `localhost:5173` and `localhost:3000`
- The backend uses Swagger for API documentation in development mode

