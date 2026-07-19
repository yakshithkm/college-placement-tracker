import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Code2, Mic, Building2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>
            Track your placement<br />readiness in real-time
          </div>
          <div style={{ opacity: 0.8, fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Get a comprehensive view of your placement preparation — from academics and projects to aptitude scores and interview performance.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: <BarChart3 size={16} />, label: 'Placement Readiness Score' },
              { icon: <Code2 size={16} />, label: 'Project & Certification Tracker' },
              { icon: <Mic size={16} />, label: 'Interview Performance Analytics' },
              { icon: <Building2 size={16} />, label: 'Live Placement Drive Board' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                {icon}
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Home
      </Link>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>PT</div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>PlaceTrack</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Sign in</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}><AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@college.edu" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ marginTop: 8, padding: '12px', fontSize: 15 }}>
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} style={{ verticalAlign: -3, marginLeft: 4 }} /></>}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong>Demo credentials:</strong><br />
          Student: student@college.edu / Student@123<br />
          Coordinator: coordinator@college.edu / Coord@123
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', collegeId: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ maxWidth: 480 }}>
          <h1 className="auth-title">Start your placement journey today</h1>
          <p className="auth-subtitle">Join thousands of students who track their placement preparation with PlaceTrack's comprehensive analytics platform.</p>
        </div>
      </div>

      <div className="auth-right" style={{ overflowY: 'auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>PT</div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>PlaceTrack</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Already have one? <Link to="/login">Sign in</Link></p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">First Name <span className="required">*</span></label>
              <input className="form-input" placeholder="Optimus" required value={form.firstName} onChange={set('firstName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name <span className="required">*</span></label>
              <input className="form-input" placeholder="Prime" required value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input className="form-input" type="email" placeholder="you@college.edu" required value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span className="required">*</span></label>
            <input className="form-input" type="password" placeholder="Min 8 chars, uppercase & number" required value={form.password} onChange={set('password')} />
          </div>
          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">College ID / Roll No.</label>
              <input className="form-input" placeholder="CS21001" value={form.collegeId} onChange={set('collegeId')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="coordinator">Placement Coordinator</option>
            </select>
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ padding: '12px', fontSize: 15, marginTop: 4 }}>
            {loading ? 'Creating account...' : <>Create Account <ArrowRight size={16} style={{ verticalAlign: -3, marginLeft: 4 }} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
