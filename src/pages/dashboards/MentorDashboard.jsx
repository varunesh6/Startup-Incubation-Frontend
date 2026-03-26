import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, FileText, CheckCircle, Calendar, X, Star as StarOutline, Users, Activity, Target, MessageSquare } from 'lucide-react';

const MentorDashboard = () => {
    const navigate = useNavigate();
    const [startups, setStartups] = useState([]);
    const [developers, setDevelopers] = useState([]); // All developers for assignment
    const [tasks, setTasks] = useState([]);

    const [evaluateModalOpen, setEvaluateModalOpen] = useState(false);
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [selectedStartup, setSelectedStartup] = useState(null);
    // reviewType, rating, feedback, documentFile, markCompleted states removed along with Review Project functionality

    const [assignTargetModalOpen, setAssignTargetModalOpen] = useState(false);
    const [selectedDevForTask, setSelectedDevForTask] = useState(null);
    const [developerSearch, setDeveloperSearch] = useState('');
    const [taskForm, setTaskForm] = useState({ title: '', description: '', day_limit: 7, review_type: 'Weekly Review' });
    const [isFieldLocked, setIsFieldLocked] = useState(false);

    // Project History Modal State
    const [projectHistoryModalOpen, setProjectHistoryModalOpen] = useState(false);
    const [selectedProjectHistory, setSelectedProjectHistory] = useState(null);

    // Evaluate Task Modal State
    const [evaluateTaskModalOpen, setEvaluateTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskFeedback, setTaskFeedback] = useState('');
    const [taskEvaluationStatus, setTaskEvaluationStatus] = useState('Completed');

    // Extension Modal State
    const [extensionModalOpen, setExtensionModalOpen] = useState(false);
    const [extensionAction, setExtensionAction] = useState('approve'); // 'approve' or 'deny'
    const [extensionNewDeadline, setExtensionNewDeadline] = useState('');
    const [extensionDenyReason, setExtensionDenyReason] = useState('');
    const [extensionApproveMessage, setExtensionApproveMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchInitialData = async () => {
            if (isMounted) await fetchData();
        }
        fetchInitialData();
        return () => { isMounted = false };
    }, []);

    const fetchData = async () => {
        try {
            const [startupsRes, devsRes, tasksRes] = await Promise.all([
                api.get(`/mentor/startups?t=${new Date().getTime()}`),
                api.get(`/mentor/developers?t=${new Date().getTime()}`),
                api.get(`/mentor/tasks?t=${new Date().getTime()}`)
            ]);
            setStartups(startupsRes.data.data);
            setDevelopers(devsRes.data.data);
            setTasks(tasksRes.data.data);
        } catch (error) {
            console.error('Failed to fetch mentor data', error);
        }
    };

    // openEvaluateModal function removed

    const openFinalizeModal = (startup) => {
        setSelectedStartup(startup);
        setFinalizeModalOpen(true);
    };

    // handleEvaluationSubmit function removed


    const handleFinalizeProject = async () => {
        try {
            await api.patch(`/mentor/startups/${selectedStartup.id}/status`, { status: 'Completed' });
            setFinalizeModalOpen(false);
            alert('Project marked as completed!');
            fetchData();
        } catch (error) {
            console.error('Failed to mark project as completed', error);
            alert(error.response?.data?.message || 'Error updating status');
        }
    };

    // Task Functions
    const openAssignModal = (startup, defaultDevId = null, defaultTitle = '') => {
        setSelectedStartup(startup);

        let devIdToLock = defaultDevId;
        
        // If no default provided, check if any task already exists for this startup
        if (!devIdToLock) {
            const existingTask = tasks.find(t => t.startup_id === startup.id);
            if (existingTask) {
                devIdToLock = existingTask.developer_id;
            }
        }

        const initialTitle = defaultTitle || startup.title || '';
        const initialDescription = `${startup.description || ''}\n\n[Mentor Remarks]:\n`;

        setTaskForm({ title: initialTitle, description: initialDescription, day_limit: 7, review_type: 'Weekly Review' });
        setDeveloperSearch('');
        setSelectedDevForTask(devIdToLock);
        setIsFieldLocked(!!devIdToLock);
        setAssignTargetModalOpen(true);
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();

        if (!selectedDevForTask) {
            alert('Please select a developer from the list first.');
            return;
        }

        try {
            let daysToAdd = 7;
            if (taskForm.review_type === 'Sprint Review (2 Weeks)') daysToAdd = 14;
            else if (taskForm.review_type === 'Monthly Review') daysToAdd = 30;

            const deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + daysToAdd);
            const deadlineIso = deadlineDate.toISOString().split('T')[0];

            await api.post(`/mentor/startups/${selectedStartup.id}/tasks`, {
                developer_id: selectedDevForTask,
                title: taskForm.title,
                description: taskForm.description,
                review_type: taskForm.review_type,
                deadline: deadlineIso
            });
            setAssignTargetModalOpen(false);

            fetchData();

        } catch (error) {
            alert(error.response?.data?.message || 'Error assigning target');
        }
    };

    const openTaskEvalModal = (task) => {
        setSelectedTask(task);
        setTaskFeedback(task.feedback || '');
        setTaskEvaluationStatus('Completed');
        setEvaluateTaskModalOpen(true);
    };

    const handleTaskEvaluation = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/mentor/tasks/${selectedTask.id}/evaluate`, {
                status: taskEvaluationStatus,
                feedback: taskFeedback
            });
            alert('Task evaluation submitted!');
            setEvaluateTaskModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error evaluating task');
        }
    };

    const openExtensionModal = (task, approveAction) => {
        setSelectedTask(task);
        setExtensionAction(approveAction ? 'approve' : 'deny');
        setExtensionNewDeadline('');
        setExtensionDenyReason('');
        setExtensionApproveMessage('');
        setExtensionModalOpen(true);
    };

    const handleExtensionSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                approve: extensionAction === 'approve',
                new_deadline: extensionAction === 'approve' ? extensionNewDeadline : null,
                reason: extensionAction === 'deny' ? extensionDenyReason : null,
                message: extensionAction === 'approve' ? extensionApproveMessage : null
            };
            await api.put(`/mentor/tasks/${selectedTask.id}/extension`, payload);
            alert(`Extension ${extensionAction === 'approve' ? 'approved' : 'denied'} successfully`);
            setExtensionModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error handling extension');
        }
    };

    // Calculate actual stats
    const assignedProjects = startups.length;
    const inProgress = startups.filter(s => s.status === 'Active' || s.status === 'Ongoing' || s.status === 'Approved').length;
    const pendingReviews = tasks.filter(t => t.status === 'Submitted' || t.extension_requested).length;

    // Group tasks into active projects (Startup + Developer pairing)
    const activeProjectsMap = new Map();
    tasks.forEach(task => {
        const key = `${task.startup_id}-${task.developer_id}`;
        if (!activeProjectsMap.has(key)) {
            activeProjectsMap.set(key, {
                startup_id: task.startup_id,
                developer_id: task.developer_id,
                startup_title: task.startup_title,
                developer_name: task.developer_name,
                tasks: []
            });
        }
        activeProjectsMap.get(key).tasks.push(task);
    });

    const activeProjects = Array.from(activeProjectsMap.values()).map(project => {
        // Sort tasks from newest to oldest
        project.tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // Active status logic based on the most recent task
        const latestTask = project.tasks[0];
        project.latest_status = latestTask ? latestTask.status : 'Unknown';
        project.pending_action = project.tasks.some(t => t.status === 'Submitted' || t.extension_requested);
        return project;
    });

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
        'Active': '#4f46e5',
        'Completed': '#3b82f6'
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
            <Navbar subtitle="Mentor Dashboard" />
            <div className="dashboard-container-light">
                <header className="dashboard-header-light">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 className="dashboard-header-light-title">Mentor Dashboard</h2>
                        <p>Approve developers, guide startups, and conduct reviews</p>
                    </div>
                </header>

                {/* Top Statistics Cards */}
                <div className="top-stats-row">

                    <div className="stat-card-light border-green">
                        <div className="stat-header">
                            <CheckCircle size={16} color="#10B981" /> Assigned Projects
                        </div>
                        <div className="stat-val" style={{ color: '#10B981' }}>{assignedProjects}</div>
                        <div className="stat-desc">Total projects</div>
                    </div>

                    <div className="stat-card-light border-blue">
                        <div className="stat-header">
                            <Activity size={16} color="#3B82F6" /> In Progress
                        </div>
                        <div className="stat-val" style={{ color: '#3B82F6' }}>{inProgress}</div>
                        <div className="stat-desc">Active now</div>
                    </div>

                    <div className="stat-card-light border-purple">
                        <div className="stat-header">
                            <Target size={16} color="#A855F7" /> Pending Reviews
                        </div>
                        <div className="stat-val" style={{ color: '#A855F7' }}>{pendingReviews}</div>
                        <div className="stat-desc">Action required</div>
                    </div>
                </div>

                {/* Charts Row */}
                {startups.length > 0 && (
                    <div className="charts-row">
                        <div className="chart-card-light">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} color="#10B981" /> Assigned Startups Status
                            </h4>
                            <p>Distribution of assigned startup statuses</p>
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
                            <p>Assigned startups by industry category</p>
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

                {/* My Assigned Startups Section */}
                <div className="section-title" style={{ marginTop: '3rem' }}>
                    <FileText size={20} color="#10b981" /> My Assigned Startups ({startups.length})
                </div>

                {startups.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                            <FileText size={32} />
                        </div>
                        <h3 style={{ color: '#1E293B', fontWeight: 600 }}>No assigned startups</h3>
                        <p style={{ color: '#64748B' }}>You will see startups here once the admin assigns them.</p>
                    </div>
                ) : (
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {startups.map(startup => (
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', width: '160px' }}>
                                        {startup.status !== 'Ongoing' && startup.status !== 'Completed' && startup.status !== 'Active' && (
                                            <button onClick={() => openAssignModal(startup)} className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                                                <Users size={16} /> Assign Dev
                                            </button>
                                        )}
                                        {(startup.status === 'Ongoing' || startup.status === 'Active') && (
                                            <button onClick={() => openFinalizeModal(startup)} className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                                                <CheckCircle size={16} /> Mark Completed
                                            </button>
                                        )}
                                        <button onClick={() => {
                                            const projectTasks = tasks.filter(t => t.startup_id === startup.id);
                                            const developerNames = [...new Set(projectTasks.map(t => t.developer_name))].filter(Boolean).join(', ') || 'No Developers Assigned';
                                            setSelectedProjectHistory({
                                                startup_id: startup.id,
                                                startup_title: startup.title,
                                                developer_name: developerNames,
                                                tasks: projectTasks
                                            });
                                            setProjectHistoryModalOpen(true);
                                        }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                                            <Activity size={16} /> View History
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Founder:</span>
                                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{startup.founder_name || 'Founder'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Category:</span>
                                        <span className="tag-badge" style={{ fontSize: '0.75rem' }}>{startup.category}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Active Developer Projects Section */}
                <div className="section-title" style={{ marginTop: '3rem' }}>
                    <Target size={20} color="#3b82f6" /> Active Developer Projects ({tasks.length})
                </div>

                {tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                            <Target size={32} />
                        </div>
                        <h3 style={{ color: '#1E293B', fontWeight: 600 }}>No active developer projects</h3>
                        <p style={{ color: '#64748B' }}>Assign projects to developers to see them here.</p>
                    </div>
                ) : (
                    <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{task.title}</h3>
                                            <span className={`badge-${task.status.toLowerCase().replace(' ', '-')}-light`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, marginTop: '0.25rem' }}>{task.description}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            onClick={() => {
                                                // Get all tasks for this developer and startup project
                                                const projectTasks = tasks.filter(t => t.startup_id === task.startup_id && t.developer_id === task.developer_id);

                                                setSelectedProjectHistory({
                                                    startup_id: task.startup_id,
                                                    developer_id: task.developer_id,
                                                    startup_title: task.startup_title,
                                                    developer_name: task.developer_name,
                                                    tasks: projectTasks.length > 0 ? projectTasks : [task]
                                                });
                                                setProjectHistoryModalOpen(true);
                                            }}
                                            className="btn-secondary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}
                                        >
                                            <FileText size={16} /> View Review History
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Developer:</span>
                                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{task.developer_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Startup:</span>
                                        <span style={{ fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>{task.startup_title}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Deadline:</span>
                                        <span style={{ fontWeight: 500, color: '#475569', fontSize: '0.9rem' }}>
                                            <Calendar size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Action items for tasks */}
                                    {(task.extension_requested || task.status === 'Submitted') && (
                                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                                            {task.extension_requested && (
                                                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '6px' }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600, marginBottom: '0.25rem' }}>Extension Requested:</div>
                                                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#92400e' }}>&quot;{task.extension_reason}&quot;</p>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); openExtensionModal(task, true); }} className="btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Approve</button>
                                                        <button onClick={(e) => { e.stopPropagation(); openExtensionModal(task, false); }} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Deny</button>
                                                    </div>
                                                </div>
                                            )}
                                            {task.status === 'Submitted' && (
                                                <button onClick={() => openTaskEvalModal(task)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.9rem' }}>
                                                    <MessageSquare size={16} /> Evaluate Submission
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assign Target to Developer Modal */}
            {assignTargetModalOpen && selectedStartup && (
                <div className="modal">
                    <div className="modal-content" style={{ position: 'relative', maxWidth: '500px', padding: '2rem' }}>
                        <button onClick={() => setAssignTargetModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <Target size={28} color="#3b82f6" />
                            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Assign New Project</h3>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', marginLeft: '3.25rem' }}>
                            Assigning project for <strong>{selectedStartup?.title}</strong>
                        </p>

                        <form onSubmit={handleAssignTask}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Developer *</label>
                                {isFieldLocked ? (
                                    <div style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.9rem' }}>
                                        {developers.find(d => d.id === selectedDevForTask)?.name || 'Pre-selected Developer'} (Locked)
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Search developers by name or email..."
                                            value={developerSearch}
                                            onChange={(e) => setDeveloperSearch(e.target.value)}
                                            style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', marginBottom: '0.5rem' }}
                                        />
                                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                                            {developers.filter(d =>
                                                d.name.toLowerCase().includes(developerSearch.toLowerCase()) ||
                                                d.email.toLowerCase().includes(developerSearch.toLowerCase())
                                            ).map(dev => (
                                                <div
                                                    key={dev.id}
                                                    onClick={() => setSelectedDevForTask(dev.id)}
                                                    style={{
                                                        padding: '0.6rem 0.75rem',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedDevForTask === dev.id ? '#eff6ff' : 'transparent',
                                                        fontWeight: selectedDevForTask === dev.id ? '600' : 'normal',
                                                        color: selectedDevForTask === dev.id ? '#2563eb' : '#334155'
                                                    }}
                                                >
                                                    {dev.name} <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>({dev.email})</span>
                                                </div>
                                            ))}
                                            {developers.filter(d =>
                                                d.name.toLowerCase().includes(developerSearch.toLowerCase()) ||
                                                d.email.toLowerCase().includes(developerSearch.toLowerCase())
                                            ).length === 0 && (
                                                    <div style={{ padding: '0.6rem 0.75rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem' }}>
                                                        No developers found matching &quot;{developerSearch}&quot;
                                                    </div>
                                                )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Build Auth Backend"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    required
                                    readOnly={isFieldLocked}
                                    style={{
                                        width: '100%',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        padding: '0.6rem 0.75rem',
                                        outline: 'none',
                                        backgroundColor: isFieldLocked ? '#f1f5f9' : '#ffffff',
                                        color: isFieldLocked ? '#64748b' : '#000000'
                                    }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Review Type *</label>
                                <select
                                    value={taskForm.review_type}
                                    onChange={(e) => setTaskForm({ ...taskForm, review_type: e.target.value })}
                                    style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a' }}
                                >
                                    <option value="Weekly Review">Weekly Review (7 Days)</option>
                                    <option value="Sprint Review (2 Weeks)">Sprint Review (14 Days)</option>
                                    <option value="Monthly Review">Monthly Review (30 Days)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Description *</label>
                                <textarea
                                    placeholder="Describe the exact deliverable required..."
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    required
                                    rows={4}
                                    style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                />
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setAssignTargetModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                    Assign Target
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluate Developer Task Modal */}
            {
                evaluateTaskModalOpen && selectedTask && (
                    <div className="modal">
                        <div className="modal-content" style={{ position: 'relative', maxWidth: '500px', padding: '2rem' }}>
                            <button onClick={() => setEvaluateTaskModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <CheckCircle size={28} color="#10b981" />
                                <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Review Submission</h3>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', marginLeft: '3.25rem' }}>
                                Evaluating <strong>{selectedTask.title}</strong> by {selectedTask.developer_name}
                            </p>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#334155', fontSize: '0.9rem', display: 'block' }}>GitHub Link:</strong>
                                    {selectedTask.github_link ?
                                        <a href={selectedTask.github_link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.9rem', wordBreak: 'break-all' }}>{selectedTask.github_link}</a> :
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Not provided</span>
                                    }
                                </div>
                                <div>
                                    <strong style={{ color: '#334155', fontSize: '0.9rem', display: 'block' }}>Work Completion File/Link:</strong>
                                    {selectedTask.work_completion_file ?
                                        <a
                                            href={selectedTask.work_completion_file.startsWith('/uploads') ? `http://localhost:5000${selectedTask.work_completion_file}` : selectedTask.work_completion_file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#2563eb', fontSize: '0.9rem', wordBreak: 'break-all', textDecoration: 'underline' }}
                                        >
                                            {selectedTask.work_completion_file.startsWith('/uploads') ? 'View Uploaded File' : selectedTask.work_completion_file}
                                        </a> :
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Not provided</span>
                                    }
                                </div>
                            </div>

                            <form onSubmit={handleTaskEvaluation}>
                                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Decision *</label>
                                    <select
                                        value={taskEvaluationStatus}
                                        onChange={(e) => setTaskEvaluationStatus(e.target.value)}
                                        required
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', backgroundColor: '#f8fafc' }}
                                    >
                                        <option value="Completed">✅ Accept & Mark Completed</option>
                                        <option value="Changes Requested">❌ Request Changes</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Feedback *</label>
                                    <textarea
                                        placeholder="Provide feedback on the code/deliverable..."
                                        value={taskFeedback}
                                        onChange={(e) => setTaskFeedback(e.target.value)}
                                        required
                                        rows={4}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button type="button" onClick={() => setEvaluateTaskModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-success" style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                        Submit Decision
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Extension Modal */}
            {extensionModalOpen && selectedTask && (
                <div className="modal" style={{ zIndex: 1050 }}>
                    <div className="modal-content" style={{ position: 'relative', maxWidth: '500px', padding: '2rem', zIndex: 1051 }}>
                        <button onClick={() => setExtensionModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <Calendar size={28} color={extensionAction === 'approve' ? "#10b981" : "#ef4444"} />
                            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>
                                {extensionAction === 'approve' ? 'Approve Extension' : 'Deny Extension'}
                            </h3>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', marginLeft: '3.25rem' }}>
                            For <strong>{selectedTask.title}</strong> by {selectedTask.developer_name}
                        </p>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                                <strong>Developer's Reason:</strong><br />
                                "{selectedTask.extension_reason}"
                            </p>
                        </div>

                        <form onSubmit={handleExtensionSubmit}>
                            {extensionAction === 'approve' ? (
                                <>
                                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>New Deadline *</label>
                                        <input
                                            type="date"
                                            value={extensionNewDeadline}
                                            onChange={(e) => setExtensionNewDeadline(e.target.value)}
                                            required
                                            style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Message (Optional)</label>
                                        <textarea
                                            placeholder="Add an optional note to the developer..."
                                            value={extensionApproveMessage}
                                            onChange={(e) => setExtensionApproveMessage(e.target.value)}
                                            rows={3}
                                            style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#1e293b' }}>Reason for Denial *</label>
                                    <textarea
                                        placeholder="Explain why the extension is being denied..."
                                        value={extensionDenyReason}
                                        onChange={(e) => setExtensionDenyReason(e.target.value)}
                                        required
                                        rows={4}
                                        style={{ width: '100%', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.6rem 0.75rem', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>
                            )}

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setExtensionModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className={extensionAction === 'approve' ? "btn-success" : "btn-primary"} style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', border: 'none', cursor: 'pointer', background: extensionAction === 'approve' ? '#10b981' : '#ef4444', color: 'white' }}>
                                    {extensionAction === 'approve' ? 'Approve Extension' : 'Deny Extension'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluate Modal Removed */}

            {/* Finalize Project Modal */}
            {finalizeModalOpen && selectedStartup && (
                <div className="modal">
                    <div className="modal-content" style={{ position: 'relative', maxWidth: '450px' }}>
                        <button onClick={() => setFinalizeModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <CheckCircle size={28} color="#10b981" />
                            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Complete Project</h3>
                        </div>

                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                            Are you sure you want to mark <strong>{selectedStartup.title}</strong> as completed? This action will finalize the project and notify the founder.
                        </p>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setFinalizeModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleFinalizeProject} className="btn-success" style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}>
                                Mark Completed
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Project History Timeline Modal */}
            {projectHistoryModalOpen && selectedProjectHistory && (
                <div className="modal">
                    <div className="modal-content" style={{ position: 'relative', maxWidth: '750px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setProjectHistoryModalOpen(false)} className="btn-close" style={{ top: '1.5rem', right: '1.5rem' }}><X size={20} color="#64748b" /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <FileText size={28} color="#3b82f6" />
                            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: '600', margin: 0 }}>Review History</h3>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem', marginLeft: '3.25rem' }}>
                            Project: <strong>{selectedProjectHistory.startup_title}</strong> — Assigned to <strong>{selectedProjectHistory.developer_name}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                            {/* Vertical timeline line */}
                            <div style={{ position: 'absolute', left: '1rem', top: '1rem', bottom: '1rem', width: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>

                            {selectedProjectHistory.tasks.map((task, idx) => (
                                <div key={task.id} style={{ position: 'relative', zIndex: 1, paddingLeft: '3rem' }}>
                                    {/* Timeline dot */}
                                    <div style={{ position: 'absolute', left: '0.4rem', top: '0.5rem', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: task.status === 'Completed' ? '#10b981' : task.status === 'Submitted' ? '#f59e0b' : '#3b82f6', border: '3px solid #ffffff', boxShadow: '0 0 0 1px #cbd5e1' }}></div>

                                    <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {task.title}
                                                    <span className={`badge-${task.status.toLowerCase().replace(' ', '-')}-light`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
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

                                        {(task.extension_requested || task.status === 'Submitted') && (
                                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                                                {task.extension_requested && (
                                                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '6px' }}>
                                                        <div style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600, marginBottom: '0.25rem' }}>Extension Requested:</div>
                                                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#92400e' }}>&quot;{task.extension_reason}&quot;</p>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={(e) => { e.stopPropagation(); openExtensionModal(task, true); }} className="btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Approve</button>
                                                            <button onClick={(e) => { e.stopPropagation(); openExtensionModal(task, false); }} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Deny</button>
                                                        </div>
                                                    </div>
                                                )}
                                                {task.status === 'Submitted' && (
                                                    <button onClick={() => {
                                                        setProjectHistoryModalOpen(false); // Close history to show eval modal cleanly
                                                        openTaskEvalModal(task);
                                                    }} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.85rem', alignSelf: 'flex-start' }}>
                                                        <MessageSquare size={16} /> Evaluate Submission
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div style={{ position: 'relative', zIndex: 1, paddingLeft: '3rem', paddingTop: '1rem' }}>
                                <div style={{ position: 'absolute', left: '0.4rem', top: '1.5rem', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#e2e8f0', border: '3px solid #ffffff' }}></div>
                                <button
                                    onClick={() => {
                                        setProjectHistoryModalOpen(false);
                                        const startupObj = startups.find(s => s.id === selectedProjectHistory.startup_id);
                                        if (startupObj) {
                                            openAssignModal(
                                                startupObj,
                                                selectedProjectHistory.developer_id,
                                                selectedProjectHistory.tasks[0]?.title || ''
                                            );
                                        }
                                    }}
                                    className="btn-success"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}
                                >
                                    <Target size={16} /> Assign Next Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default MentorDashboard;
