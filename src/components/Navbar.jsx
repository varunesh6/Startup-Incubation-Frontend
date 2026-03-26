import { useAuth } from '../context/AuthContext';
import { LogOut, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ subtitle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="top-navbar">
            <div className="navbar-left">
                <div className="navbar-logo">
                    <Rocket size={24} color="#ffffff" style={{ background: '#10B981', padding: '0.4rem', borderRadius: '8px', width: '40px', height: '40px' }} />
                </div>
                <div className="navbar-titles">
                    <h1>Startup Incubation Portal</h1>
                    <p>{subtitle || 'Dashboard'}</p>
                </div>
            </div>

            <div className="navbar-right">
                <div className="user-info">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-email">{user?.email || 'user@example.com'}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
