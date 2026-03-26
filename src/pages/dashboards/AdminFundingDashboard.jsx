import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const AdminFundingDashboard = () => {
    const { user, logout } = useAuth();
    const [startups, setStartups] = useState([]);
    const [fundingRecords, setFundingRecords] = useState([]);
    const [summary, setSummary] = useState({ totalOverall: 0, summary: [] });
    const [activeTab, setActiveTab] = useState('records'); // 'records', 'summary', 'add'

    const [formData, setFormData] = useState({
        startup_id: '',
        investor_name: '',
        amount: '',
        status: 'Committed',
        date: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [startupsRes, fundingRes, summaryRes] = await Promise.all([
                api.get('/admin/startups'), // reuse admin startups list
                api.get('/funding'),
                api.get('/funding/summary')
            ]);
            setStartups(startupsRes.data.data);
            setFundingRecords(fundingRes.data.data);
            setSummary(summaryRes.data.data);
        } catch (error) {
            console.error('Failed to fetch funding data', error);
        }
    };

    const handleAddFunding = async (e) => {
        e.preventDefault();
        try {
            await api.post('/funding', formData);
            alert('Funding record added!');
            setFormData({ startup_id: '', investor_name: '', amount: '', status: 'Committed', date: '' });
            fetchData();
            setActiveTab('records');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add funding');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2>Funding Management</h2>
                <div className="header-actions">
                    <Link to="/admin" className="btn-secondary">Back to Admin</Link>
                    <span className="user-badge">{user?.name}</span>
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </header>

            <div className="tabs">
                <button className={`tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>All Records</button>
                <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary Report</button>
                <button className={`tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add Funding</button>
            </div>

            <div className="dashboard-content">
                {activeTab === 'records' && (
                    <section className="table-section">
                        <h3>Funding Records</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Startup</th>
                                    <th>Investor</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fundingRecords.map(record => (
                                    <tr key={record.id}>
                                        <td>{record.startup_title}</td>
                                        <td>{record.investor_name}</td>
                                        <td>${Number(record.amount).toLocaleString()}</td>
                                        <td><span className={`status badge-${record.status.toLowerCase()}`}>{record.status}</span></td>
                                        <td>{new Date(record.funding_date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {activeTab === 'summary' && (
                    <section className="table-section">
                        <h3>Funding Summary Report</h3>
                        <div className="summary-cards">
                            <div className="summary-card total">
                                <h4>Total Received Funding</h4>
                                <p className="large-amount">${Number(summary.totalOverall).toLocaleString()}</p>
                            </div>
                        </div>
                        <table className="data-table mt-4">
                            <thead>
                                <tr>
                                    <th>Startup</th>
                                    <th>Total Funding Received</th>
                                    <th>Investments Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.summary.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.startup_name}</td>
                                        <td>${Number(item.total_funding || 0).toLocaleString()}</td>
                                        <td>{item.number_of_investments}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {activeTab === 'add' && (
                    <section className="form-section">
                        <h3>Add New Funding Record</h3>
                        <form onSubmit={handleAddFunding} className="funding-form">
                            <div className="form-group">
                                <label>Startup</label>
                                <select
                                    value={formData.startup_id}
                                    onChange={(e) => setFormData({ ...formData, startup_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Startup...</option>
                                    {startups.map(s => (
                                        <option key={s.id} value={s.id}>{s.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Investor Name</label>
                                <input
                                    type="text"
                                    value={formData.investor_name}
                                    onChange={(e) => setFormData({ ...formData, investor_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Amount ($)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Committed">Committed</option>
                                    <option value="Received">Received</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary">Add Record</button>
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
};

export default AdminFundingDashboard;
