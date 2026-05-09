import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'CASHIER'
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ username: '', password: '', name: '', role: 'CASHIER' });
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="users-module">
      <div className="header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h2>User Management</h2>
          <p className="text-muted">Manage staff accounts and access permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> New Account
        </button>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {users.map(u => (
          <div key={u.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                {u.role === 'ADMIN' ? <Shield size={24} /> : <User size={24} />}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{u.name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>@{u.username} • {u.role}</p>
              </div>
            </div>
            {u.username !== 'admin' && (
              <button 
                onClick={() => handleDelete(u.id)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Create User Account</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input required type="text" className="input-field" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Username</label>
                <input required type="text" className="input-field" placeholder="username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Password</label>
                <input required type="password" name="new-password" placeholder="••••••••" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Role</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="CASHIER">Cashier (POS & Inventory only)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
