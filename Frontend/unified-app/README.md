# Unified Login App

## Overview

This is a **unified login application** with a single login page for all user roles (Rider, Admin, Customer). After authentication, users are automatically routed to their role-specific dashboard.

## Features

- ✅ **Single Login Page** - One login form for all users
- ✅ **User Authentication Only** - Simple username/password login
- ✅ **Role-Based Routing** - Automatically routes to the correct dashboard based on user role
- ✅ **Unified Experience** - One app, multiple dashboards

## Getting Started

### Installation

```bash
cd Frontend/unified-app
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will open at: http://localhost:3000

## Usage

### Login

1. Open http://localhost:3000
2. Enter your credentials:
   - **Rider:** Username: `rider1`, Password: `password123`
   - **Admin:** Username: `admin`, Password: `password123`
   - **Customer:** Username: `customer1`, Password: `password123`
3. Click "Login"
4. You'll be automatically redirected to your role-specific dashboard:
   - Riders → `/rider` (Rider Dashboard)
   - Admins → `/admin` (Admin Dashboard)
   - Customers → `/customer` (Customer Dashboard)

## Routes

- `/login` - Unified login page
- `/` - Auto-redirects based on user role
- `/rider` - Rider dashboard (protected, Rider role only)
- `/admin` - Admin dashboard (protected, Admin role only)
- `/customer` - Customer dashboard (protected, Customer role only)

## Architecture

- **Single Login Page** - Accepts any user role
- **Role-Based Routing** - After login, routes based on user role
- **Protected Routes** - Each dashboard is protected and role-specific
- **Shared Components** - Navbar adapts based on user role

## Differences from Separate Apps

- ✅ One login page instead of three
- ✅ One app instead of three separate apps
- ✅ Automatic role-based routing
- ✅ Simpler setup (one app to run)

---

**Unified login with role-based dashboards!** 🚀
