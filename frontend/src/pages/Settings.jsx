import React, { useState, useEffect } from 'react';
import { Save, Store, MapPin, Phone, Percent, MessageSquare, Info, Download, Database, Upload, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    STORE_NAME: 'Paint Center',
    STORE_ADDRESS: '123 Main St, Batangas City',
    CONTACT_PHONE: '0917-000-0000',
    TAX_RATE: '12',
    RECEIPT_FOOTER: 'Thank you for choosing us!'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data === 'object') {
            setSettings(prev => ({...prev, ...data}));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleBackup = () => {
    window.open('/api/settings/backup', '_blank');
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("WARNING: All CURRENT records (sales, inventory, customers) will be deleted and replaced by this backup. Proceed?")) {
      e.target.value = ''; // Reset input
      return;
    }

    setRestoring(true);
    const formData = new FormData();
    formData.append('backup', file);

    try {
      const response = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        alert('Database Restored! The page will now refresh.');
        window.location.reload();
      } else {
        const err = await response.json();
        alert('Restore failed: ' + err.error);
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Error connecting to server.');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  const handleChange = (e) => {
    setSettings({...settings, [e.target.name]: e.target.value});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        alert('Configuration updated successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error connecting to server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading store configuration...</div>;

  return (
    <div className="settings-module" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      <div className="header-actions" style={{ marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Store Configuration</h2>
          <p className="text-muted">Global variables and receipt settings for your business.</p>
        </div>
        <button className="btn btn-primary hover-lift" onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Branch Info */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--primary)' }}>
            <Store size={22} />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Branch Details</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Store Name</label>
              <input type="text" name="STORE_NAME" className="input-field" value={settings.STORE_NAME} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}><Phone size={14} /> Contact Number</label>
              <input type="text" name="CONTACT_PHONE" className="input-field" value={settings.CONTACT_PHONE} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}><Percent size={14} /> Tax Rate (%)</label>
              <input type="number" name="TAX_RATE" className="input-field" value={settings.TAX_RATE} onChange={handleChange} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}><MapPin size={14} /> Branch Address</label>
              <input type="text" name="STORE_ADDRESS" className="input-field" value={settings.STORE_ADDRESS} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--secondary)' }}>
            <MessageSquare size={22} />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Receipt Customization</h3>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Footer Message</label>
            <textarea name="RECEIPT_FOOTER" className="input-field" rows="3" value={settings.RECEIPT_FOOTER} onChange={handleChange} style={{ resize: 'vertical' }} />
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Info size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>Use this field for store policies or return conditions.</p>
            </div>
          </div>
        </div>

        {/* Data Maintenance */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#f59e0b' }}>
            <Database size={22} />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Data Maintenance</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 4px 0' }}>Database Backup</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Protect your data by downloading a local backup.</p>
              </div>
              <button className="btn btn-outline" onClick={handleBackup} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
                <Download size={16} /> Download
              </button>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 4px 0', color: '#ef4444' }}>Restore Records</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Restore from a previous .db backup file.</p>
              </div>
              <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', cursor: restoring ? 'not-allowed' : 'pointer', borderColor: '#ef4444', color: '#ef4444' }}>
                {restoring ? 'Restoring...' : <><Upload size={16} /> Upload Backup</>}
                <input type="file" accept=".db" hidden onChange={handleRestore} disabled={restoring} />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
