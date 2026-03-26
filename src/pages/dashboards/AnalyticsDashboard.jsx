import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const AnalyticsDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [fundingTrend, setFundingTrend] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [statsRes, trendRes] = await Promise.all([
                api.get('/analytics/stats'),
                api.get('/analytics/funding-trend')
            ]);   
            setStats(statsRes.data.data);
            setFundingTrend(trendRes.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    };

    if (!stats) return <div className="loading">Loading analytics...</div>;

    const startupStatusData = [
        { name: 'Approved', value: stats.approvedStartups },
        { name: 'Pending', value: stats.pendingStartups },
        { name: 'Rejected', value: stats.rejectedStartups }
    ];

    const COLORS = ['#4caf50', '#ffeb3b', '#f44336'];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2>Platform Analytics</h2>
                <div className="header-actions">
                    <Link to="/admin" className="btn-secondary">Back to Admin</Link>
                    <span className="user-badge">{user?.name} (Admin)</span>
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Startups</h3>
                        <p className="stat-number">{stats.totalStartups}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Funding</h3>
                        <p className="stat-number">${Number(stats.totalFundingReceived).toLocaleString()}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Mentors</h3>
                        <p className="stat-number">{stats.activeMentors}</p>
                    </div>
                </div>

                <div className="charts-grid mt-4">
                    <div className="chart-container">
                        <h3>Startup Status Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={startupStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {startupStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-container">
                        <h3>Funding Trend (Monthly)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={fundingTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total" fill="#2196f3" name="Funding ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
