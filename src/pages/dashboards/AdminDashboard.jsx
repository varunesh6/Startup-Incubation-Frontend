import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, CheckCircle, XCircle, Users, Activity, User, Check, X } from 'lucide-react';
import Navbar from '../../components/Navbar';

const AdminDashboard = () => {
    const [startups, setStartups] = useState([]);
    const [mentors, setMentors] = useState([]);

    // Modal State
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedStartupId, setSelectedStartupId] = useState(null);
    const [selectedMentor, setSelectedMentor] = useState('');
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    // Reviews Modal State
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
    const [selectedStartupForReviews, setSelectedStartupForReviews] = useState(null);
    const [startupReviews, setStartupReviews] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [startupsRes, usersRes] = await Promise.all([
                api.get('/admin/startups'),
                api.get('/admin/users')
            ]);
            setStartups(startupsRes.data.data);

            const mentorUsers = usersRes.data.data.filter(u => u.role === 'Mentor');
            setMentors(mentorUsers);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        }
    };

    const openApproveModal = (id) => {
        setSelectedStartupId(id);
        setSelectedMentor('');
        setApprovalNotes('');
        setApproveModalOpen(true);
    };

    const openRejectModal = (id) => {
        setSelectedStartupId(id);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const submitApprove = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/startups/${selectedStartupId}/status`, { status: 'Approved' });
            if (selectedMentor) {
                await api.post(`/admin/startups/${selectedStartupId}/assign-mentor`, { mentor_id: selectedMentor });
            }
            fetchData();
            setApproveModalOpen(false);
        } catch (error) {
            console.error('Failed to approve startup', error);
            alert('Error approving startup');
        }
    };

    const submitReject = async (e) => {
        e.preventDefault();
        try {
            // Note: If backend supports passing rejection reason, pass it here
            await api.put(`/admin/startups/${selectedStartupId}/status`, { status: 'Rejected', reason: rejectionReason });
            fetchData();
            setRejectModalOpen(false);
        } catch (error) {
            console.error('Failed to reject startup', error);
            alert('Error rejecting startup');
        }
    };

    // Removed Finalize Modal functions

    const fetchReviews = async (startup) => {
        try {
            const res = await api.get(`/admin/startups/${startup.id}/reviews`);
            setSelectedStartupForReviews(startup);
            setStartupReviews(res.data.data || []);
            setReviewsModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
            alert('Could not fetch review history.');
        }
    };

    // Calculate Statistics
    const pendingReview = startups.filter(s => s.status === 'Pending').length;
    const approved = startups.filter(s => s.status === 'Approved' || s.status === 'Active' || s.status === 'Ongoing').length;
    const rejected = startups.filter(s => s.status === 'Rejected').length;
    const totalStartups = startups.length;

    // Split startups for lists
    const pendingStartups = startups.filter(s => s.status === 'Pending');
    const pastSubmissions = startups.filter(s => s.status !== 'Pending');

    // Pie Chart Data
    const statusCounts = startups.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    const STATUS_COLORS = {
        'Pending': '#f59e0b',
        'Approved': '#10b981',
        'Rejected': '#ef4444',
        'Active': '#4f46e5'
    };

    // Bar Chart Data
    const categoryCounts = startups.reduce((acc, curr) => {
        const cat = curr.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.keys(categoryCounts).map(cat => ({
        name: cat,
        Total: categoryCounts[cat]
    }));

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <Navbar subtitle="Admin Dashboard" />
            <div className="dashboard-container-light">
                {/* Header */}
                <header className="dashboard-header-light">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 className="dashboard-header-light-title">Admin Dashboard</h2>
                        <p>Review and manage all startup submissions</p>
                    </div>
                </header>

                {/* Top Statistics Cards */}
                <div className="top-stats-row">
                    <div className="stat-card-light border-yellow">
                        <div className="stat-header">
                            <Clock size={16} color="#F59E0B" /> Pending Review
                        </div>
                        <div className="stat-val" style={{ color: '#F59E0B' }}>{pendingReview}</div>
                        <div className="stat-desc">Awaiting decision</div>
                    </div>

                    <div className="stat-card-light border-green">
                        <div className="stat-header">
                            <CheckCircle size={16} color="#10B981" /> Approved
                        </div>
                        <div className="stat-val" style={{ color: '#10B981' }}>{approved}</div>
                        <div className="stat-desc">Active projects</div>
                    </div>

                    <div className="stat-card-light border-red">
                        <div className="stat-header">
                            <XCircle size={16} color="#EF4444" /> Rejected
                        </div>
                        <div className="stat-val" style={{ color: '#EF4444' }}>{rejected}</div>
                        <div className="stat-desc">Not approved</div>
                    </div>

                    <div className="stat-card-light border-blue">
                        <div className="stat-header">
                            <Users size={16} color="#3B82F6" /> Total Startups
                        </div>
                        <div className="stat-val" style={{ color: '#3B82F6' }}>{totalStartups}</div>
                        <div className="stat-desc">All submissions</div>
                    </div>
                </div>

                {/* Charts Row */}
                {startups.length > 0 && (
                    <div className="charts-row">
                        <div className="chart-card-light">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} color="#10B981" /> Status Overview
                            </h4>
                            <p>Distribution of startup statuses</p>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={100}
                                            dataKey="value"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} stroke="#ffffff" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card-light">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={18} color="#10B981" /> Categories Distribution
                            </h4>
                            <p>Startups by industry category</p>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="Total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Submissions Section */}
                <div className="section-title" style={{ marginTop: '2rem' }}>
                    <Clock size={20} color="#F59E0B" /> Pending Submissions ({pendingReview})
                </div>

                {pendingStartups.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: '#dcfce7', color: '#10b981' }}>
                            <CheckCircle size={32} />
                        </div>
                        <h3 style={{ color: '#1E293B', fontWeight: 600 }}>All caught up!</h3>
                        <p style={{ color: '#64748B' }}>No pending submissions to review at this time.</p>
                    </div>
                ) : (
                    <div className="ideas-list">
                        {pendingStartups.map(startup => (
                            <div key={startup.id} className="idea-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <div className="idea-header">
                                    <h3 className="idea-title">
                                        {startup.title}
                                        <span className={`badge-pending-light`}>
                                            <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                            Pending
                                        </span>
                                    </h3>
                                </div>
                                <p className="idea-desc">{startup.description}</p>

                                <div className="idea-meta">
                                    <div className="idea-meta-left" style={{ flex: 1 }}>
                                        <div className="meta-item" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center' }}><User size={14} style={{ marginRight: '0.5rem' }} /> Founder:</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{startup.founder_name}</span>
                                        </div>
                                        <div className="meta-item" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                            <span>Category:</span>
                                            <span className="tag-badge">{startup.category}</span>
                                        </div>
                                        <div className="meta-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Submitted:</span>
                                            <span style={{ fontWeight: 600, color: '#475569' }}>{new Date(startup.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-card-actions">
                                    <button onClick={() => openApproveModal(startup.id)} className="btn-success" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold' }}>
                                        <CheckCircle size={18} /> Approve & Assign Mentor
                                    </button>
                                    <button onClick={() => openRejectModal(startup.id)} className="btn-danger" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold' }}>
                                        <XCircle size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* All Submissions History */}
                <div className="section-title mt-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1.5rem', marginTop: '2.5rem' }}>
                    <Activity size={20} color="#3b82f6" /> All Submissions ({pastSubmissions.length})
                </div>

                {pastSubmissions.length > 0 ? (
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pastSubmissions.map(startup => (
                            <div key={startup.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{startup.title}</h3>
                                            <span className={`badge-${startup.status.toLowerCase().replace(' ', '-')}-light`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                {startup.status}
                                            </span>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, marginTop: '0.25rem' }}>{startup.description}</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => fetchReviews(startup)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                            View Review History
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: startup.mentor_name ? '0.5rem' : '0', borderBottom: startup.mentor_name ? '1px solid #f1f5f9' : 'none' }}>
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Founder:</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{startup.founder_name}</span>
                                        </div>
                                        {startup.mentor_name && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Mentor:</span>
                                                <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.9rem' }}>{startup.mentor_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#64748b' }}>No past submissions.</p>
                )}
            </div>

            {/* Approve Modal */}
            {
                approveModalOpen && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '500px' }}>
                            <button onClick={() => setApproveModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <div style={{ background: '#10B981', borderRadius: '6px', padding: '0.25rem', display: 'flex' }}>
                                    <Check color="#ffffff" size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Approve Startup</h3>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', marginLeft: '3.25rem' }}>Assign a mentor to guide this startup</p>

                            <form onSubmit={submitApprove}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Assign Mentor *</label>
                                    <select
                                        value={selectedMentor}
                                        onChange={(e) => setSelectedMentor(e.target.value)}
                                        required
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #bbf7d0', padding: '0.6rem 0.75rem', outline: 'none', backgroundColor: '#ffffff', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto', marginBottom: '0.5rem' }}
                                    >
                                        <option value="" disabled>Select a mentor</option>
                                        {mentors.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <textarea
                                        placeholder="Add any notes for the founder..."
                                        value={approvalNotes}
                                        onChange={(e) => setApprovalNotes(e.target.value)}
                                        rows={2}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #bbf7d0', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setApproveModalOpen(false)} style={{ padding: '0.5rem 1.25rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-success" style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                        Approve & Assign
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Reject Modal */}
            {
                rejectModalOpen && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '500px' }}>
                            <button onClick={() => setRejectModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <div style={{ color: '#EF4444', display: 'flex' }}>
                                    <X size={28} strokeWidth={3} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Reject Startup</h3>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', marginLeft: '2.5rem' }}>Provide feedback for the rejection</p>

                            <form onSubmit={submitReject}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Rejection Reason *</label>
                                    <textarea
                                        placeholder="Explain why this startup is being rejected..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                        rows={3}
                                        style={{ width: '100%', borderRadius: '6px', border: '2px solid #94a3b8', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setRejectModalOpen(false)} style={{ padding: '0.5rem 1.25rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#0a0a0a', color: '#ffffff', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                        Reject
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Finalize Modal Removed */}

            {/* Project Review History Modal */}
            {
                reviewsModalOpen && selectedStartupForReviews && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '750px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                            <button onClick={() => setReviewsModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <Activity size={28} color="#3b82f6" />
                                <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Project History</h3>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem', marginLeft: '3.25rem' }}>
                                Mentor evaluations for <strong>{selectedStartupForReviews.title}</strong>
                            </p>

                            {startupReviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                    <p style={{ color: '#64748b', margin: 0 }}>No reviews have been submitted for this project yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                                    {/* Vertical timeline line */}
                                    <div style={{ position: 'absolute', left: '1rem', top: '1rem', bottom: '1rem', width: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>

                                    {startupReviews.map((task, idx) => (
                                        <div key={task.id} style={{ position: 'relative', zIndex: 1, paddingLeft: '3rem' }}>
                                            {/* Timeline dot */}
                                            <div style={{ position: 'absolute', left: '0.4rem', top: '0.5rem', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: task.status === 'Completed' ? '#10b981' : task.status === 'Submitted' ? '#f59e0b' : '#3b82f6', border: '3px solid #ffffff', boxShadow: '0 0 0 1px #cbd5e1' }}></div>

                                            <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {task.title}
                                                            <span className={`badge-${task.status?.toLowerCase().replace(' ', '-')}-light`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                                                {task.status}
                                                            </span>
                                                        </h4>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                                                            <span>Assigned: {new Date(task.created_at).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span>Review Type: {task.review_type || 'Standard Task'}</span>
                                                            <span>•</span>
                                                            <span>Deadline: <strong style={{ color: '#475569' }}>{new Date(task.deadline).toLocaleDateString()}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 1rem 0' }}>{task.description}</p>

                                                {(task.github_link || task.work_completion_file) && (
                                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
                                                        {task.github_link && (
                                                            <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                                                <strong style={{ color: '#475569' }}>GitHub:</strong> <a href={task.github_link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{task.github_link}</a>
                                                            </div>
                                                        )}
                                                        {task.work_completion_file && (
                                                            <div style={{ fontSize: '0.85rem' }}>
                                                                <strong style={{ color: '#475569' }}>File:</strong> <a href={task.work_completion_file.startsWith('/uploads') ? `http://localhost:5000${task.work_completion_file}` : task.work_completion_file} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{task.work_completion_file.startsWith('/uploads') ? 'Download Uploaded File' : task.work_completion_file}</a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {task.feedback && (
                                                    <div style={{ background: task.status === 'Changes Requested' ? '#fef2f2' : '#f0fdf4', borderLeft: `3px solid ${task.status === 'Changes Requested' ? '#ef4444' : '#10b981'}`, padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: task.status === 'Changes Requested' ? '#b91c1c' : '#047857', marginBottom: '0.25rem' }}>Mentor Feedback:</p>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>{task.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default AdminDashboard;
