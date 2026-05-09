import React, { useState, useEffect } from 'react';
import { History, Search, Printer, User, Droplets, Trash2 } from 'lucide-react';
import { formatPeso } from '../utils/format';

const MixingHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/mixing/formulas');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch mix logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mixing log? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/mixing/formulas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLogs(logs.filter(l => l.id !== id));
      }
    } catch (err) {
      alert('Failed to delete log');
    }
  };

  const handlePrint = (log) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const content = `
      <html>
        <head>
          <title>Paint Label - ${log.color_name}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; border: 1px dashed #ccc; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .section { margin-bottom: 8px; }
            .bold { font-weight: bold; }
            .tint-list { font-size: 12px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h2 style="margin:0;">PAINT CENTER</h2>
            <p style="margin:0; font-size:12px;">Custom Color Formula</p>
          </div>
          <div class="section">
            <div class="bold">COLOR: ${log.color_name}</div>
            <div>CODE: ${log.color_code}</div>
          </div>
          <div class="section">
            <div class="bold">BASE:</div>
            <div>${log.baseProduct?.brand} ${log.baseProduct?.name}</div>
            <div>Amount: ${log.total_amount || log.total_volume_ml} ${log.unit || 'ML'}</div>
          </div>
          <div class="section">
            <div class="bold">FORMULA:</div>
            <div class="tint-list">
              ${log.tints.map(t => `<div>• ${t.tintProduct?.name}: ${t.amount || t.volume_ml}${t.unit || 'ML'}</div>`).join('')}
            </div>
          </div>
          <div class="section" style="font-size:10px; border-top: 1px solid #000; padding-top: 5px; margin-top: 10px;">
            Date: ${new Date(log.created_at).toLocaleString()}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const filteredLogs = logs.filter(log => 
    (log.color_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.color_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mixing-history-module">
      <div className="header-actions" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Mixing Log & Formula History</h2>
          <p className="text-muted">Retrieve past color formulas and customer-specific mixes.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by color, code or customer..." 
            style={{ paddingLeft: '40px', width: '350px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel">
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Color Details</th>
              <th style={{ padding: '12px' }}>Customer</th>
              <th style={{ padding: '12px' }}>Formula Composition</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '13px' }}>{new Date(log.created_at).toLocaleDateString()}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplets size={14} color="var(--primary)" />
                    {log.color_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {log.color_code} | {log.brand}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  {log.customer ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} /> {log.customer.name}
                    </div>
                  ) : <span className="text-muted">Walk-in</span>}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ fontWeight: 600 }}>Base:</span> {log.baseProduct?.name} ({log.total_amount || log.total_volume_ml}{log.unit || 'ML'})
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {log.tints.map((t, idx) => (
                      <span key={idx} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '10px' }}>
                        {t.tintProduct?.name}: {t.amount || t.volume_ml}{t.unit || 'ML'}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handlePrint(log)}
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={14} /> Reprint
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleDelete(log.id)}
                      style={{ padding: '6px', color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MixingHistory;
