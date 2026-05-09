import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
      setLoading(false);
    }
    // Redirect happens automatically in App.jsx when isAuthenticated changes
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <div className="glass-panel" style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={32} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc' }}>Paint Center Pro</h2>
          <p className="text-muted" style={{ marginTop: '8px' }}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
            <input id="username" required type="text" className="input-field" placeholder="Username" style={{ paddingLeft: '44px', width: '100%' }} value={username} onChange={e => setUsername(e.target.value)} />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
            <input id="password" required type={showPassword ? "text" : "password"} className="input-field" placeholder="Password" style={{ paddingLeft: '44px', width: '100%' }} value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div id="login-error" style={{ color: '#ef4444', fontSize: '14px', textAlign: 'left' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '48px', marginTop: '8px' }}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div style={{ marginTop: '32px', fontSize: '12px', color: '#64748b' }}>
          &copy; 2026 Paint Center ERP Project V1.0
        </div>
      </div>
    </div>
  );
};

export default Login;
