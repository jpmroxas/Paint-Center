import React, { useState, useEffect } from 'react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact_details: '', address: '' });

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) setSuppliers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', contact_details: '', address: '' });
        fetchSuppliers();
      }
    } catch (e) {
      alert('Error saving supplier');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSuppliers();
    } catch (e) {
      alert('Error deleting supplier');
    }
  };

  return (
    <div className="suppliers-module">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Suppliers Directory</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Supplier</button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', backgroundColor: 'var(--surface-color)', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add New Supplier</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required type="text" className="input-field" placeholder="Supplier Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" className="input-field" placeholder="Contact Person / Phone" value={formData.contact_details} onChange={e => setFormData({...formData, contact_details: e.target.value})} />
              <textarea className="input-field" placeholder="Address" style={{ minHeight: '80px' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-panel">
        {loading ? <p>Loading suppliers...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Contact</th>
                <th style={{ padding: '12px' }}>Address</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}><strong>{s.name}</strong></td>
                  <td style={{ padding: '12px' }}>{s.contact_details || <span className="text-muted">—</span>}</td>
                  <td style={{ padding: '12px' }}>{s.address || <span className="text-muted">—</span>}</td>
                  <td style={{ padding: '12px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No suppliers added yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
