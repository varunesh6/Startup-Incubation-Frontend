import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb, Clock, Activity, Star, Plus, X, Calendar, Users, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';

const FounderDashboard = () => {
    const [startups, setStartups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        documents: ''
    });

    // Reviews Modal State
    const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
    const [selectedStartupForReviews, setSelectedStartupForReviews] = useState(null);
    const [startupReviews, setStartupReviews] = useState([]);

    useEffect(() => {
        fetchStartups();
    }, []);

    const fetchStartups = async () => {
        try {
            const res = await api.get('/founder/startups');
            setStartups(res.data.data);
        } catch (error) {
            console.error('Failed to fetch startups', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/founder/startups', {
                ...formData,
                funding_required: 0 // Mocking funding for backend compatibility if required
            });
            setFormData({ title: '', description: '', category: '', documents: '' });
            setIsModalOpen(false);
            fetchStartups();
        } catch (error) {
            console.error('Failed to submit startup', error);
            alert('Error submitting idea. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchReviews = async (startup) => {
        try {
            const res = await api.get(`/founder/startups/${startup.id}/reviews`);
            setSelectedStartupForReviews(startup);
            setStartupReviews(res.data.data || []);
            setReviewsModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
            alert('Could not fetch review history.');
        }
    };

    // Calculate Statistics for Top Cards
    const totalIdeas = startups.length;
    const pendingReview = startups.filter(s => s.status === 'Pending').length;
    const activeProjects = startups.filter(s => s.status === 'Approved' || s.status === 'Active' || s.status === 'Ongoing').length;
    const completedProjectsList = startups.filter(s => s.status === 'Completed');
    // Mock rating for UI purposes
    const avgRating = startups.length > 0 ? (Math.random() * (5 - 3.5) + 3.5).toFixed(1) : 0;

    // Calculate Data for Pie Chart (Status Distribution)
    const statusCounts = startups.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
    }));

    // Status colors: Pending=Orange, Approved=Green, Rejected=Red
    const STATUS_COLORS = {
        'Pending': '#f59e0b',
        'Approved': '#10b981',
        'Rejected': '#ef4444',
        'Active': '#4f46e5'
    };

    // Calculate Data for Bar Chart (Category Breakdown)
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
            <Navbar subtitle="Founder Dashboard" />
            <div className="dashboard-container-light">
                <header className="dashboard-header-light">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 className="dashboard-header-light-title">Founder Dashboard</h2>
                        <p>Submit and track your innovative startup ideas</p>
                    </div>
                    <div className="header-actions">
                        <button onClick={() => setIsModalOpen(true)} className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 'bold' }}>
                            <Plus size={18} /> Submit New Idea
                        </button>
                    </div>
                </header>

                {/* Top Statistics Cards */}
                <div className="top-stats-row">
                    <div className="stat-card-light border-green">
                        <div className="stat-header">
                            <Lightbulb size={16} color="#10B981" /> Total Ideas
                        </div>
                        <div className="stat-val" style={{ color: '#10B981' }}>{totalIdeas}</div>
                        <div className="stat-desc">All submissions</div>
                    </div>

                    <div className="stat-card-light border-yellow">
                        <div className="stat-header">
                            <Clock size={16} color="#F59E0B" /> Pending Review
                        </div>
                        <div className="stat-val" style={{ color: '#F59E0B' }}>{pendingReview}</div>
                        <div className="stat-desc">Awaiting admin</div>
                    </div>

                    <div className="stat-card-light border-blue">
                        <div className="stat-header">
                            <Activity size={16} color="#3B82F6" /> Active Projects
                        </div>
                        <div className="stat-val" style={{ color: '#3B82F6' }}>{activeProjects}</div>
                        <div className="stat-desc">In development</div>
                    </div>

                    <div className="stat-card-light border-purple">
                        <div className="stat-header">
                            <Star size={16} color="#A855F7" /> Avg Rating
                        </div>
                        <div className="stat-val" style={{ color: '#A855F7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {avgRating} <Star size={24} fill="#FCD34D" color="#FCD34D" />
                        </div>
                        <div className="stat-desc">{totalIdeas} evaluations</div>
                    </div>
                </div>

                {/* Charts Row */}
                {startups.length > 0 && (
                    <div className="charts-row">
                        <div className="chart-card-light">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} color="#10B981" /> Status Distribution
                            </h4>
                            <p>Overview of your startup statuses</p>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={100}
                                            paddingAngle={2}
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
                                <Users size={18} color="#10B981" /> Categories Breakdown
                            </h4>
                            <p>Your ideas by category</p>
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

                {/* Ideas List Section */}
                <div className="section-title" style={{ marginTop: '2rem' }}>
                    <Lightbulb size={20} color="#10B981" /> My Startup Ideas
                </div>

                {startups.length === 0 ? (
                    <div className="empty-state" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                        <div className="empty-icon">
                            <Lightbulb size={32} />
                        </div>
                        <h3 style={{ color: '#1E293B', fontWeight: 600 }}>No startup ideas yet</h3>
                        <p style={{ color: '#64748B' }}>Start your entrepreneurial journey by submitting your first idea!</p>
                        <button onClick={() => setIsModalOpen(true)} className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', marginTop: '1rem' }}>
                            <Plus size={20} /> Submit Your First Idea
                        </button>
                    </div>
                ) : (
                    <div className="ideas-list">
                        {startups.map(startup => (
                            <div key={startup.id} className="idea-card founder-card">
                                <div className="idea-header">
                                    <h3 className="idea-title">
                                        {startup.title}
                                        <span className={`badge-${startup.status.toLowerCase()}-light`}>
                                            <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                            {startup.status}
                                        </span>
                                    </h3>
                                </div>
                                <p className="idea-desc">{startup.description}</p>

                                <div className="idea-meta">
                                    <div className="idea-meta-left">
                                        <div className="meta-item">
                                            <span style={{ marginRight: '0.5rem' }}>Category:</span>
                                            <span className="tag-badge">{startup.category}</span>
                                        </div>
                                    </div>
                                    <div className="meta-item">
                                        <Calendar size={14} /> Submitted: {new Date(startup.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <button onClick={() => fetchReviews(startup)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                            View Reviews
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Project History (Completed Startups) */}
                <div className="section-title" style={{ marginTop: '3rem' }}>
                    <CheckCircle size={20} color="#3B82F6" /> Project History ({completedProjectsList.length})
                </div>

                {completedProjectsList.length === 0 ? (
                    <div className="empty-state" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '1rem', marginTop: '0' }}>
                        <p style={{ color: '#64748B' }}>No projects have been completed yet.</p>
                    </div>
                ) : (
                    <div className="ideas-list" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {completedProjectsList.map(startup => (
                            <div key={startup.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{startup.title}</h3>
                                            <span className={`badge-completed-light`} style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontWeight: 600 }}>
                                                Completed
                                            </span>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, marginTop: '0.25rem' }}>{startup.description}</p>
                                    </div>
                                    <div>
                                        <button onClick={() => fetchReviews(startup)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                            View Reviews
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Category:</span>
                                        <span className="tag-badge">{startup.category}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Final Delivery:</span>
                                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>Completed</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit Idea Modal */}
                {isModalOpen && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative' }}>
                            <button onClick={() => setIsModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>
                            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: '600', marginBottom: '0.25rem' }}>Submit Startup Idea</h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Provide details about your innovative startup concept</p>

                            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Startup Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #bbf7d0', padding: '0.6rem 0.75rem', outline: 'none' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #bbf7d0', padding: '0.6rem 0.75rem', outline: 'none', backgroundColor: '#ffffff', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                                    >
                                        <option value="" disabled>Select a category</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Fintech">Fintech</option>
                                        <option value="Education">Education</option>
                                        <option value="E-commerce">E-commerce</option>
                                        <option value="SaaS">SaaS</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Description *</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        rows={3}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #bbf7d0', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Documents (comma-separated URLs)</label>
                                    <input
                                        type="text"
                                        name="documents"
                                        value={formData.documents}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #94a3b8', padding: '0.6rem 0.75rem', outline: 'none' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1.25rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="btn-success" style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                        {isSubmitting ? 'Submitting...' : 'Submit Idea'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Project Review History Modal */}
                {reviewsModalOpen && selectedStartupForReviews && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '750px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                            <button onClick={() => setReviewsModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <Star size={28} color="#f59e0b" fill="#f59e0b" />
                                <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Review History</h3>
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
                )}
            </div>
        </div>
    );
};

export default FounderDashboard;
