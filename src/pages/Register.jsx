import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Rocket, Lightbulb, Code, Users, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        organization: '',
        role: 'Founder'
    });
    const [error, setError] = useState('');
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }
        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    const roles = [
        { id: 'Founder', icon: Lightbulb, label: 'Founder', desc: 'Submit innovative startup ideas' },
        { id: 'Developer', icon: Code, label: 'Developer', desc: 'Apply and build approved startups' },
        { id: 'Mentor', icon: Users, label: 'Mentor', desc: 'Guide and evaluate projects' },
        { id: 'Admin', icon: ShieldCheck, label: 'Admin', desc: 'Review and manage submissions' }
    ];

    return (
        <div className="register-container">
            <div className="auth-form">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <Rocket size={28} strokeWidth={2.5} />
                    </div>
                </div>
                <h2 className="auth-title">Join Startup Incubation Portal</h2>
                <p className="auth-subtitle">Create your account and start your journey</p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Organization (Optional)</label>
                        <input
                            type="text"
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            placeholder="Your company or organization"
                        />
                    </div>

                    <div className="form-group">
                        <span className="role-label">Select Your Role</span>
                        <div className="role-grid">
                            {roles.map(r => {
                                const Icon = r.icon;
                                const isSelected = formData.role === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        className={`role-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleRoleSelect(r.id)}
                                    >
                                        <div className="role-card-icon">
                                            <Icon size={20} strokeWidth={2.2} />
                                        </div>
                                        <div className="role-card-content">
                                            <h4>{r.label}</h4>
                                            <p>{r.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary">Create Account</button>
                </form>

                <div className="auth-links">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
