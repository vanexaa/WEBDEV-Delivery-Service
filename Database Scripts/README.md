# Database Scripts Guide

This folder contains all SQL scripts used for setting up, seeding, testing, and maintaining the databases for **WEBDEV-Delivery-Service**.

⚠️ **Important Rule**: Do NOT run all scripts blindly. Each script has a specific purpose and safe execution order.

---

## 📁 Script Categories & Usage

### 🔧 SETUP (Run once per environment)

These scripts create the databases, tables, and core database logic.

Run these **first**, and only once unless you are resetting everything.

```
00_SetupAllDatabases.sql
02_CreateStoredProcedures.sql
```

**Purpose:**

* Create all service databases
* Create tables, relationships, and stored procedures

---

### 🌱 SEED DATA (Safe to re-run)

These scripts create **test users and core profiles** required for the system to function.

```
05_CreateTestAccounts.sql
09_CreateRiderRecord.sql
```

**What they do:**

* Create test accounts:

  * admin / password123
  * rider1 / password123
  * customer1 / password123
* Create a rider profile linked to `rider1`

✔ Uses `IF NOT EXISTS`
✔ Does NOT delete business data

---

### 🧪 SCENARIO TESTING (Manual execution only)

These scripts create **business-flow test data** such as orders, deliveries, and assignments.

⚠️ These are **NOT seed scripts** and should only be run when testing.

```
06_CreateTestOrder.sql
07_CreateTestOrderWithDelivery.sql
```

**Purpose:**

* Test order creation
* Test rider assignment
* Test order tracking and delivery flow

⚠️ May delete or overwrite previous test orders
⚠️ Should NOT be included in CI or auto-run

---

### 🛠 MAINTENANCE / RECOVERY (⚠️ Dangerous)

These scripts modify existing data or schema and must be run **only when needed**.

```
08_CreateDeliveriesForExistingOrder.sql
11_RemoveDeliveryOrderForeignKey.sql
```

**Use cases:**

* Fix missing deliveries for existing orders
* Modify or remove foreign key constraints

🚨 **WARNING:**

* Do NOT run in production
* Do NOT run unless you understand the impact

---

### 🔍 HELPERS / DEBUGGING

Utility scripts used for troubleshooting and validation.

```
10_GetCustomerIdByUserId.sql
```

**Purpose:**

* Verify UserId → CustomerId mapping
* Diagnose why orders may not appear in the frontend

✔ Read-only or minimal impact

---

### 🧰 UTILITIES

Supporting tools used during development.

```
GeneratePasswordHash.cs
GenerateHashApp
```

**Purpose:**

* Generate BCrypt password hashes for test accounts

---

## ▶️ Recommended Execution Order (Local Development)

### First-time setup:

```
00_SetupAllDatabases.sql
02_CreateStoredProcedures.sql
05_CreateTestAccounts.sql
09_CreateRiderRecord.sql
```

### To test data flow:

Run **only one** of the following:

```
06_CreateTestOrder.sql
```

OR

```
07_CreateTestOrderWithDelivery.sql
```

### Debugging / fixing issues:

```
10_GetCustomerIdByUserId.sql
08_CreateDeliveriesForExistingOrder.sql
```

---

## ✅ Final Notes

* Seed scripts should never depend on scenario scripts
* Scenario scripts should only clean up data they create
* Maintenance scripts are **manual and intentional only**

Keeping this separation ensures:

* Predictable database state
* Safe re-runs
* Clean testing and debugging

---

📌 **Tip:** If something breaks, run helper scripts first before maintenance scripts.
