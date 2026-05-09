import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Store, PaintBucket, PackageSearch, Users, Calculator, Settings as SettingsIcon, Receipt, Moon, Sun, LogOut, History, DollarSign, Bell, AlertTriangle } from 'lucide-react';
import './App.css';
import { CartProvider } from './CartContext';

import POS from './pages/POS';
import Inventory from './pages/Inventory';
import PaintMixing from './pages/PaintMixing';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Suppliers from './pages/Suppliers';
import Purchasing from './pages/Purchasing';
import Expenses from './pages/Expenses';
import MixingHistory from './pages/MixingHistory';
import UsersPage from './pages/Users';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [notifications, setNotifications] = useState({ lowStock: 0, overdue: 0 });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchAlerts = async () => {
        try {
          const [invRes, custRes] = await Promise.all([
            fetch('/api/inventory/products'),
            fetch('/api/customers')
          ]);
          if (invRes.ok && custRes.ok) {
            const products = await invRes.ok ? await invRes.json() : [];
            const customers = await custRes.ok ? await custRes.json() : [];
            const lowStock = products.filter(p => p.stock_quantity <= p.reorder_level).length;
            const overdue = customers.filter(c => c.outstanding_balance > 0).length; // Simplified for MVP
            setNotifications({ lowStock, overdue });
          }
        } catch (e) {
          console.error('Alerts fetch failed');
        }
      };
      fetchAlerts();
    }
  }, [isAuthenticated]);

  const toggleDark = () => {
    setDarkMode(d => {
      const next = !d;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
      return next;
    });
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Initializing...</div>;

  if (!isAuthenticated) return <Login />;

  return (
    <CartProvider>
      <Router>
      <div className="app-container">
        {/* Navigation Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px' }}>
            <h2 style={{ margin: 0 }}>Paint<span className="accent-text">Center</span></h2>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="notif-btn"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <Bell size={18} />
                {(notifications.lowStock > 0 || notifications.overdue > 0) ? (
                  <span style={{ 
                    position: 'absolute', 
                    top: '4px', 
                    right: '4px', 
                    width: '10px', 
                    height: '10px', 
                    backgroundColor: '#ef4444', 
                    borderRadius: '50%', 
                    border: '2px solid #1d4ed8',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                  }} />
                ) : null}
              </button>
              {showNotifications && (
                <div className="glass-panel" style={{ 
                  position: 'absolute', 
                  left: 'calc(100% + 12px)', 
                  top: '-10px', 
                  width: '240px', 
                  zIndex: 1000, 
                  padding: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.6)' }}>Notifications</h4>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      {notifications.lowStock + notifications.overdue}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.lowStock > 0 && (
                      <NavLink 
                        to="/inventory" 
                        onClick={() => setShowNotifications(false)}
                        style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          color: '#fbbf24', 
                          fontSize: '13px', 
                          padding: '10px', 
                          backgroundColor: 'rgba(251, 191, 36, 0.1)', 
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)'}
                      >
                        <AlertTriangle size={14} /> <span>{notifications.lowStock} Low stock items</span>
                      </NavLink>
                    )}
                    {notifications.overdue > 0 && (
                      <NavLink 
                        to="/customers" 
                        onClick={() => setShowNotifications(false)}
                        style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          color: '#f87171', 
                          fontSize: '13px', 
                          padding: '10px', 
                          backgroundColor: 'rgba(248, 113, 113, 0.1)', 
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)'}
                      >
                        <AlertTriangle size={14} /> <span>{notifications.overdue} Unpaid balances</span>
                      </NavLink>
                    )}
                    {notifications.lowStock === 0 && notifications.overdue === 0 && (
                      <p style={{ fontSize: '12px', margin: 0, textAlign: 'center', padding: '12px 0', color: 'rgba(255,255,255,0.4)' }}>All systems normal.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Store size={20} />
              <span>Point of Sale</span>
            </NavLink>
            <NavLink to="/inventory" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <PackageSearch size={20} />
              <span>Inventory</span>
            </NavLink>
            <NavLink to="/mixing" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <PaintBucket size={20} />
              <span>Paint Mixing</span>
            </NavLink>
            <NavLink to="/customers" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Customers & AR</span>
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Calculator size={20} />
              <span>Reports</span>
            </NavLink>
            <NavLink to="/transactions" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Receipt size={20} />
              <span>Transactions</span>
            </NavLink>
            <NavLink to="/mixing-history" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <History size={20} />
              <span>Mixing Log</span>
            </NavLink>

            {user?.role === 'ADMIN' && (
              <>
                <div style={{ marginTop: '16px', padding: '0 16px', marginBottom: '8px' }}>
                  <small className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Finance & Admin</small>
                </div>
                <NavLink to="/expenses" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <DollarSign size={20} />
                  <span>Expenses</span>
                </NavLink>
                <NavLink to="/users" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Users size={20} />
                  <span>Manage Users</span>
                </NavLink>
              </>
            )}

            <div style={{ marginTop: '16px', padding: '0 16px', marginBottom: '8px' }}>
              <small className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Inventory Ops</small>
            </div>
            <NavLink to="/suppliers" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={20} />
              <span>Suppliers</span>
            </NavLink>
            <NavLink to="/purchasing" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Store size={20} />
              <span>Purchasing</span>
            </NavLink>
          </nav>
          
          <div className="sidebar-footer">
            <button
              onClick={toggleDark}
              className="nav-item"
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <SettingsIcon size={20} />
              <span>Settings</span>
            </NavLink>
            <button className="nav-item" onClick={logout} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 'auto', color: '#ef4444' }}>
              <LogOut size={20} />
              <span>Log out</span>
            </button>
            <div className="admin-profile" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role || 'Manager'}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/mixing" element={<PaintMixing />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/suppliers" element={<Suppliers />} />
             <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/mixing-history" element={<MixingHistory />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={
              <div className="glass-panel" style={{textAlign: 'center', marginTop: '10%'}}>
                <h2>Under Construction</h2>
                <p>This module is currently being built.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
    </CartProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
