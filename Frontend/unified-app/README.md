# Unified Frontend App

This is a unified frontend application that combines all three apps (Rider, Customer, Admin) into a single app running on **port 3000**.

## Setup

1. Install dependencies:
```bash
cd Frontend/unified-app
npm install
```

2. Copy page files from individual apps:
   - Copy pages from `rider-app/src/pages/*` to `unified-app/src/pages/rider/`
   - Copy pages from `customer-app/src/pages/*` to `unified-app/src/pages/customer/`
   - Copy pages from `admin-app/src/pages/*` to `unified-app/src/pages/admin/`
   - Copy components from all apps to `unified-app/src/components/`

3. Run the app:
```bash
npm run dev
```

The app will start on **http://localhost:3000**

## How It Works

- **Single Port**: All frontend functionality runs on port 3000
- **Role-Based Routing**: After login, users are redirected to their role-specific dashboard:
  - Admin → `/admin/dashboard`
  - Rider → `/rider/dashboard`
  - Customer → `/customer/track`
- **Unified API**: All API calls go to UnifiedService on port 5000

## Structure

```
unified-app/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── rider/
│   │   ├── customer/
│   │   └── admin/
│   ├── components/
│   ├── services/
│   │   └── api.js (unified API service)
│   ├── App.jsx (role-based routing)
│   └── main.jsx
```

## Benefits

- ✅ One port for frontend (3000)
- ✅ One port for backend (5000)
- ✅ Single `npm run dev` command
- ✅ Easier to manage and deploy
- ✅ Role-based access control built-in
