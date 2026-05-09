import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, Tag, FileText } from 'lucide-react';
import { formatPeso } from '../utils/format';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 'UTILITIES',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ description: '', category: 'UTILITIES', amount: '', expense_date: new Date().toISOString().split('T')[0] });
        fetchExpenses();
      }
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchExpenses();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="expenses-module">
      <div className="header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Business Expenses</h2>
          <p className="text-muted">Track overheads, rent, and utility payouts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {['UTILITIES', 'RENT', 'SALARY', 'OTHER'].map(cat => {
          const total = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
          return (
            <div key={cat} className="glass-panel text-center">
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{cat}</h3>
              <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>{formatPeso(total)}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-panel">
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}>{new Date(e.expense_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>{e.description}</td>
                <td style={{ padding: '12px' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>{e.category}</span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatPeso(e.amount)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Log Business Expense</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Description</label>
                <input required type="text" className="input-field" placeholder="e.g. Electric Bill April" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="UTILITIES">Utilities</option>
                    <option value="RENT">Rent</option>
                    <option value="SALARY">Salary</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input type="date" className="input-field" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Amount (₱)</label>
                <input required type="number" step="0.01" className="input-field" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
