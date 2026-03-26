import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import FounderDashboard from './pages/dashboards/FounderDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import MentorDashboard from './pages/dashboards/MentorDashboard';
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />; // Or an unauthorized page
    }

    return children;
};

function App() {
    const { user } = useAuth();

    // Redirect to appropriate dashboard based on role
    const getDashboardRoute = () => {
        switch (user?.role) {
            case 'Founder': return '/founder';
            case 'Admin': return '/admin';
            case 'Mentor': return '/mentor';
            case 'Developer': return '/developer';
            default: return '/login';
        }
    };

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardRoute()} />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to={getDashboardRoute()} />} />

                {/* Default Route */}
                <Route path="/" element={<Navigate to={user ? getDashboardRoute() : '/login'} />} />

                {/* Protected Routes */}
                <Route
                    path="/founder/*"
                    element={
                        <ProtectedRoute allowedRoles={['Founder']}>
                            <FounderDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoles={['Admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mentor/*"
                    element={
                        <ProtectedRoute allowedRoles={['Mentor']}>
                            <MentorDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/developer/*"
                    element={
                        <ProtectedRoute allowedRoles={['Developer', 'Mentor']}>
                            <DeveloperDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
