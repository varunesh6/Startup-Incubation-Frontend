# Startup Incubation Portal - Frontend

This is the frontend application for the **Startup Incubation Portal**, a comprehensive platform designed to manage and accelerate startup projects by connecting Founders, Admins, Mentors, and Developers.

## 🚀 Features

- **Role-Based Access Control & Dashboards**: Customized interfaces tailored to different user roles:
  - **Founder Dashboard**: Track project progress, manage startup teams, and view performance analytics.
  - **Admin Dashboard**: Oversee all users, manage platform projects, and monitor system-wide metrics.
  - **Mentor Dashboard**: Guide assigned startups, review developer tasks, and manage project workflows.
  - **Developer Dashboard**: View assigned tasks, submit code, and update the status of startup projects.
- **Secure Authentication**: JWT-based token authentication with protected routes and role verification.
- **Data Visualization**: Interactive charts for visual analytics powered by Recharts.
- **Modern UI**: Clean and responsive design utilizing Lucide React icons.
- **Vercel Deployment Ready**: Built-in `vercel.json` to handle Single Page Application (SPA) routing natively on Vercel.

## 🛠️ Tech Stack

- **Core Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Charts & Graphs**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Token Management**: `jwt-decode` and React Context API

## ⚙️ Getting Started Local Development

### Prerequisites

- Node.js (v16.x or newer)
- npm (or yarn/pnpm)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Setup environment configuration:
   *(If your project requires environmental variables, create a `.env` file referencing your backend URL.)*
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will generally be accessible at `http://localhost:5173`.

## 📦 Build & Deployment

To build the optimized production application:

```bash
npm run build
```

The optimized code will be compiled into the `dist/` directory.

### Deploying to Vercel

This frontend project includes a `vercel.json` which automatically configures route rewrites. This resolves 404 errors when refreshing standard React Router paths.

1. Import your repository on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Set the **Root Directory** to your `frontend` folder (if it's a monorepo).
3. Vercel will automatically detect Vite and run `npm run build`.
4. Deploy!

## 📁 Directory Structure

```text
src/
├── components/       # Reusable, modular UI components
├── context/          # React Contexts (e.g., AuthContext for state)
├── pages/            # Main application layouts and screens
│   ├── dashboards/   # Specific dashboard screens for each Role
│   ├── Login.jsx     # User authentication entry
│   └── Register.jsx  # New user registration
├── services/         # API calls and external integrations
├── App.jsx           # Application tree and Route definitions
└── main.jsx          # React DOM entry point
```
