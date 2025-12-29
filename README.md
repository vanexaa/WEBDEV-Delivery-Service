# WEBDEV-Delivery-Service — juysi-backend (Backend)

## Overview
This branch contains backend work for the Delivery Service project. Key changes include customer-facing APIs (ETA, rider info, feedback), service-layer additions, database entities and repositories, SQL seed scripts, EF Core migrations, and security/response shaping improvements.

## Branch highlights
- feat: finalized security wiring and response shaping for task 2
- feat: completed customer APIs and verified ETA stub
- docs: added Service Layer and repository/entities documentation
- docs: added SQL seeding script for testing
- feat: EF Core migrations to create initial Delivery schema

## Notable files & folders
- `Backend/pom.xml` — Spring Boot (Java) project configuration (Java 17, Spring Boot 3.2)
- `Backend/src/main/java/com/delivery/service` — Spring Boot app & controllers
  - `DeliveryServiceApplication.java` — app entry point
  - `controllers/CustomerController.java` — endpoints: GET `/api/customers/{orderId}/eta`, GET `/api/customers/{orderId}/rider`
- `Backend/Controllers/CustomerController.cs` — .NET controller with endpoints:
  - GET `/api/customers/{orderId}/rider`
  - GET `/api/customers/{orderId}/eta`
  - POST `/api/customers/{orderId}/feedback`
- `Backend/Program.cs` — .NET entrypoint + database connection config (default points to `JUYSI\\SQLEXPRESS`)
- `Backend/Migrations/` — EF Core migration files
- `Backend/DatabaseScripts/` — SQL seed scripts (`deliveryservicetable.sql`, `deliveryservicedb.sql`, `test-customer_rating-feedback.sql`)

## Run instructions
### Java (Spring Boot)
- Using Maven wrapper (Windows):
  - cd into `Backend` then run:
    - `mvnw.cmd spring-boot:run` (or `mvn -f Backend/pom.xml spring-boot:run`)
- Default behavior: app runs on `http://localhost:8080` and uses H2 (in-memory) as configured via `pom.xml` dependency.

### .NET (ASP.NET Core)
- Ensure you have .NET SDK installed
- Run the API:
  - `dotnet run --project Backend/Backend.csproj`
- Important: `Program.cs` contains a connection string defaulting to `Server=JUYSI\\SQLEXPRESS;Database=DeliveryServiceDB;...` — update as needed for your environment
- To apply EF Core migrations (requires `dotnet-ef`):
  - `dotnet ef database update --project Backend/Backend.csproj`

### Database seed (SQL Server)
- Use your SQL client (SSMS / sqlcmd) to run the scripts in `Backend/DatabaseScripts/` to seed sample data if you are using SQL Server.
  - Example with `sqlcmd` (adjust server and authentication):
    - `sqlcmd -S .\\SQLEXPRESS -i Backend\\DatabaseScripts\\deliveryservicetable.sql`

## API examples
- GET rider details (returns rider contact data)
  - curl: `curl http://localhost:5000/api/customers/101/rider` (if .NET runs on port 5000) or `http://localhost:8080/api/customers/101/rider` for Java

- GET ETA
  - curl: `curl http://localhost:8080/api/customers/123/eta`

- POST feedback (example payload)
  - curl:
    - `curl -X POST http://localhost:5000/api/customers/101/feedback -H "Content-Type: application/json" -d "{ \"rating\": 5, \"comments\": \"Great!\" }"`

> Note: exact host/port depends on which runtime you start (Java or .NET) and their local configuration.

## Tests and validation
- No unit tests are included in this branch. Manual testing can be performed by running the app and using the endpoints above or importing `Backend/DatabaseScripts/test-customer_rating-feedback.sql` into the DB.
