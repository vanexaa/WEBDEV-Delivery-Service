# Frontend Applications - React Implementation

All three frontend applications have been rebuilt using **React** with **Vite**, **Bootstrap 5**, and **React Router**.

## 📁 Project Structure

Each application follows a consistent structure:

```
app-name/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components (routes)
│   ├── services/       # API service functions
│   ├── utils/          # Utilities (AuthContext, helpers)
│   ├── App.jsx         # Main app component with routing
│   ├── App.css         # App-specific styles
│   ├── main.jsx        # React entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies
└── vite.config.js      # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend services running (see main README.md)

### Installation & Running

**Rider App (Port 3000):**
```bash
cd Frontend/rider-app
npm install
npm run dev
```

**Admin App (Port 3001):**
```bash
cd Frontend/admin-app
npm install
npm run dev
```

**Customer App (Port 3002):**
```bash
cd Frontend/customer-app
npm install
npm run dev
```

## 🏗️ Architecture

### Technology Stack
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Bootstrap 5** - UI framework (via CDN)
- **Vanilla CSS** - Custom styling only
- **fetch() API** - HTTP requests

### Key Features

#### Authentication
- JWT tokens stored in `localStorage`
- `AuthContext` provides authentication state globally
- Protected routes redirect to login if not authenticated
- Role-based access control

#### State Management
- React Hooks (`useState`, `useEffect`)
- Context API for authentication
- No external state management libraries

#### API Communication
- Centralized API service files in `src/services/api.js`
- `fetchWithAuth` helper automatically adds JWT tokens
- Error handling with try/catch

#### Routing
- React Router for client-side routing
- Protected routes with authentication check
- Clean URL structure

## 📱 Applications Overview

### 1. Rider App (`rider-app/`)

**Routes:**
- `/login` - Login page
- `/` - Dashboard (active orders)
- `/orders/:orderId` - Order details page
- `/earnings` - Earnings summary
- `/profile` - Rider profile

**Key Components:**
- `DashboardPage` - Shows active deliveries
- `OrderDetailsPage` - Order management and status updates
- `EarningsPage` - Earnings history and statistics
- `AvailabilityToggle` - Online/Offline toggle
- `OrderCard` - Order card component

**Features:**
- View and manage assigned orders
- Update delivery status
- Navigate to customer address
- View earnings and feedback
- Online/Offline availability toggle

### 2. Customer App (`customer-app/`)

**Routes:**
- `/login` - Login page
- `/` - Track order page

**Key Components:**
- `TrackOrderPage` - Order tracking interface
- `RiderInfoCard` - Rider information display
- `StatusTimeline` - Delivery status timeline
- `FeedbackForm` - Rating and feedback form

**Features:**
- Track order by Order ID
- View delivery status and timeline
- View rider information
- View ETA
- Submit feedback after delivery

### 3. Admin App (`admin-app/`)

**Routes:**
- `/login` - Login page
- `/` - Dashboard
- `/riders` - Riders management
- `/deliveries` - All deliveries

**Key Components:**
- `DashboardPage` - Statistics and recent deliveries
- `RidersPage` - Rider management (placeholder)
- `DeliveriesPage` - All deliveries list

**Features:**
- View system statistics
- Monitor active deliveries
- View all riders (requires API endpoint)
- Manage deliveries

## 🔧 Development

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📝 Code Structure

### Components
- Functional components only
- Hooks for state and effects
- Props for data passing
- Clear separation of concerns

### Services
- API functions organized by service
- Centralized configuration
- Error handling
- Token management

### Styling
- Bootstrap 5 classes for layout
- Custom CSS only for specific styling
- Responsive design (mobile-first)
- Clean, maintainable styles

## 🔐 Authentication Flow

1. User logs in via `LoginPage`
2. `AuthContext.login()` calls API
3. Token and user data stored in `localStorage`
4. `AuthContext` state updated
5. Protected routes check `isAuthenticated`
6. API calls include token in headers
7. Logout clears state and storage

## 🌐 API Integration

All API calls use the existing backend endpoints:
- Auth Service: `http://localhost:5001/api/auth`
- Delivery Service: `http://localhost:5003/api/deliveries`
- Rider Service: `http://localhost:5005/api/riders`
- Customer Service: `http://localhost:5007/api/customers`

See `API_DOCUMENTATION.md` in the root directory for endpoint details.

## 🎨 UI/UX

- **Bootstrap 5** for consistent styling
- **Bootstrap Icons** for icons
- **Responsive design** - works on mobile, tablet, desktop
- **Clean card-based layouts**
- **Loading states** with spinners
- **Error handling** with user-friendly messages
- **Form validation** with HTML5 and React

## 📚 Best Practices

1. **Component Structure**: Small, focused components
2. **State Management**: Local state when possible, Context for auth
3. **Error Handling**: Try/catch with user feedback
4. **Loading States**: Show spinners during async operations
5. **Code Organization**: Clear folder structure
6. **Comments**: Code is self-documenting, comments where needed

## 🐛 Troubleshooting

### Port Already in Use
Change port in `vite.config.js`:
```js
server: {
  port: 3003  // Change to available port
}
```

### API Connection Errors
- Ensure backend services are running
- Check API base URLs in `src/services/api.js`
- Verify CORS settings in backend

### Authentication Issues
- Check token in `localStorage`
- Verify JWT secret matches backend
- Check token expiration

### Build Errors
- Delete `node_modules` and reinstall
- Check Node.js version (18+)
- Clear npm cache: `npm cache clean --force`

---

For backend setup, see the main `README.md` in the root directory.
