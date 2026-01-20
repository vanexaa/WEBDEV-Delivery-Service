# Kapebara

**Branching & Permissions (Read First)**
- **Branches:** `master`, `test`, `feature`.
- **Master:** final output — only team leaders may push/merge to `master`.
- **Test:** used to test each service's features; can be extended per-service (e.g. `test/notification, test/order, test/auth`).
- **Feature:** development branches for individual work. Naming convention:
	- Example: `feature/notification/bell-button`
	- Do NOT include the word "service" (avoid `feature/notification-service/...`).
- **Permissions:** Only leaders of each service/module are allowed to push and merge into `master`.
- **Leaders' responsibilities:** review and verify group members' tasks/developments to ensure the correct feature is being developed in the frontend.
- **Critical files:** only leaders may modify `src/App.jsx` and `src/main.jsx` — be careful (gulo mo, ayos mo).

**Install Dependencies**
- Clone the repo and install dependencies with your package manager of choice:

	- Using npm:

		```bash
		npm install
		npm run dev
		```

	- Using yarn:

		```bash
		yarn
		yarn dev
		```

- Make sure you are using a supported Node.js version (use an LTS release when possible).

**Installed Dependency Versions**
- Frontend dependencies (from `package.json`):
	- **react:** 19.2.3
	- **react-dom:** 19.2.0
	- **react-router-dom:** 7.12.0
	- **bootstrap:** 5.3.8
	- **react-bootstrap:** 2.10.10
- Dev dependencies:
	- **vite:** 7.2.4
	- **eslint / @eslint/js:** 9.39.1
	- **@types/react:** 19.2.5
	- **@types/react-dom:** 19.2.3
	- **@vitejs/plugin-react:** 5.1.1

If you add or update dependencies, update `package.json` and run `npm install` (or `yarn`) and notify the team lead.

**Project Structure & Directory Roles**
- **`src/api`**: where API calls happen. Axios is used for HTTP requests (standard practice); keep API call logic centralized here and export functions for services to consume. Example: `src/api/menuApi.js`.
- **`src/assets`**: store logos, images, fonts and static assets used across the app.
- **`src/components`**: shared UI components used by any part of the app (buttons, modals, common layout pieces).
- **`src/context`**: place React context providers here; contexts are a way to share state or functions across the tree without prop drilling.
- **`src/hooks`**: custom React hooks — reusable logic shared across components. Example hook below.
- **`src/pages`**: top-level pages. Each service has its own subfolder (e.g. `src/pages/Notification`), and there is a `Shared` directory for pages used across services.
- **`src/routes`**: centralized routing; keep route definitions and route-related helpers here (e.g. `src/routes/AppRoutes.jsx`).
- **`src/sections`**: reusable pieces that compose pages (smaller than pages, larger than atomic components). Sections are grouped per service.
- **`src/services`**: contains folders per service (Notification, Order, Payment, etc.) for service-specific components, hooks, and external API wrappers — used when a service needs its own local structure.
- **`src/utils`**: helper functions (algorithms, converters, small utilities). Keep these pure and well-documented.
- **Index files:** each directory contains an `index.js` to centralize exports so other modules can import from the folder root instead of deep paths.

**CSS File Convention**
- When creating styles for a component/file, create a CSS file in the same directory with the same base name and `.css` extension. Example:
	- Component: `src/components/common/Button.jsx`
	- Styles: `src/components/common/Button.css`

**API / Axios Guidance**
- Keep all HTTP logic in `src/api`. Prefer small wrapper functions per endpoint and return data in a predictable shape. This keeps components clean and testable.

**Environment Variables & Configuration**

⚠️ **CRITICAL: Never commit API keys or secrets to GitHub!**

All sensitive information (API keys, base URLs, secrets) must be stored in a `.env` file (which is gitignored). Never hardcode them in your code.

**Setup:**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual service URLs and API keys:
   ```dotenv
   AUTH_SERVICE_URL=http://localhost:3001
   MENU_SERVICE_URL=http://localhost:3002
   ORDER_SERVICE_URL=http://localhost:3003
   DELIVERY_SERVICE_URL=http://localhost:3004
   PAYMENT_SERVICE_URL=http://localhost:3005
   NOTIFICATION_SERVICE_URL=http://localhost:3006
   ```

3. Access environment variables in your code using `import.meta.env`:
   ```js
   const authUrl = import.meta.env.VITE_AUTH_SERVICE_URL;
   ```

**Naming Convention for Environment Variables**

- Prefix all environment variables with `VITE_` (Vite requirement for client-side exposure).
- Use `SCREAMING_SNAKE_CASE` for variable names.
- Group related variables by service.
- Use descriptive suffixes: `_URL`, `_API_KEY`, `_TOKEN`, etc.

**Examples:**
```dotenv
VITE_AUTH_SERVICE_URL=http://localhost:3001
VITE_AUTH_API_KEY=your-auth-api-key-here
VITE_MENU_SERVICE_URL=http://localhost:3002
VITE_ORDER_SERVICE_URL=http://localhost:3003
VITE_PAYMENT_API_KEY=your-payment-api-key-here
VITE_PAYMENT_WEBHOOK_SECRET=your-webhook-secret-here
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3006
```

**⚠️ Security Warnings**

1. **Never commit `.env` to GitHub** — it contains sensitive data.
2. **Never hardcode API keys** in your source code.
3. **Always add `.env` to `.gitignore`** (verify it's already there):
   ```
   .env
   .env.local
   .env.*.local
   ```
4. **Use `.env.example`** as a template for other developers — it should only contain placeholder values.
5. **Rotate API keys regularly** and update them in your deployment environment.
6. **Use different keys** for development, testing, and production.

**Hooks Example**
- Put shared hooks in `src/hooks`. Example `useFetch` (illustrative):

```js
// src/hooks/useFetch.js
import { useState, useEffect } from 'react';

export function useFetch(url) {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		fetch(url)
			.then((r) => r.json())
			.then((d) => mounted && setData(d))
			.catch((e) => mounted && setError(e))
			.finally(() => mounted && setLoading(false));

		return () => {
			mounted = false;
		};
	}, [url]);

	return { data, loading, error };
}
```

Usage: import from `src/hooks` index and call `const { data, loading, error } = useFetch('/api/items')` inside components.

**Routing**
- Place all routing logic in `src/routes`. Keep `AppRoutes.jsx` focused on route-level composition and lazy-loaded pages where appropriate.

**Sections vs Components**
- `src/components` contains generic shared components.
- `src/sections` contains page-specific or service-specific grouped UI pieces which are reused by pages within the same service.

**Services Folder**
- `src/services` groups each service into its own folder with its own `api`, `components`, and `hooks` if needed. This allows feature autonomy and easier testing.

**Utilities**
- `src/utils` stores helper functions (formatters, converters, small algorithms). Keep these pure and well-documented.

**Export Centralization**
- Each directory has an `index.js` to re-export relevant symbols. Importers should use folder-level imports, e.g. `import { something } from 'src/utils'`.

**Contributing / Workflow Notes**
- Create feature branches with the pattern `feature/<service>/<short-feature-name>`.
- Open pull requests targeted at `test/<service>` or `test` for cross-service tests. Only when reviewed and approved by the service leader should a PR be merged to `master`.
- Keep PRs small and focused. Leaders should verify the frontend feature corresponds to the expected specification.

**After Merging Successfully**
- After merging successfully, delete the branch on GitHub to keep the repository clean.


