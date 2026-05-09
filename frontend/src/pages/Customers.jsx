import React, { useState, useEffect } from 'react';
import { formatPeso } from '../utils/format';

const Customers = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '', customer_type: 'RETAIL', contact_details: '', address: '', credit_limit: 0
  });
  const [statementCustomer, setStatementCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [payAmounts, setPayAmounts] = useState({});

  const fetchCustomers = async () => {
    try {
      const [custRes, invRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/customers/all-invoices').catch(() => null)  // graceful degradation
      ]);
      if (custRes.ok) setCustomers(await custRes.json());
      // Fallback: compute overdue from each customer's invoices fetched lazily
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          credit_limit: Number(newCustomer.credit_limit)
        })
      });
      if (response.ok) {
        setShowModal(false);
        fetchCustomers(); // Refresh the list
        setNewCustomer({ name: '', customer_type: 'RETAIL', contact_details: '', address: '', credit_limit: 0 });
      } else {
        alert('Failed to save customer.');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to the server');
    }
  };

  const totalAR = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);
  const contractorCount = customers.filter(c => c.customer_type === 'CONTRACTOR').length;

  // Calculate aging: days past due_date
  const agingBucket = (inv) => {
    const now = new Date();
    const due = new Date(inv.due_date);
    const days = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'current';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
  };

  // For aging tab: collect all customer invoices when tab opens
  const [agingData, setAgingData] = useState([]);
  const [loadingAging, setLoadingAging] = useState(false);

  const loadAgingReport = async () => {
    setLoadingAging(true);
    try {
      const results = [];
      for (const c of customers.filter(c => c.outstanding_balance > 0)) {
        const res = await fetch(`/api/customers/${c.id}/invoices`);
        if (res.ok) {
          const invs = await res.json();
          const unpaid = invs.filter(i => i.status !== 'PAID');
          if (unpaid.length > 0) {
            const buckets = { '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, current: 0 };
            unpaid.forEach(i => { buckets[agingBucket(i)] += i.remaining_balance; });
            results.push({ name: c.name, ...buckets, total: c.outstanding_balance });
          }
        }
      }
      setAgingData(results);
    } finally {
      setLoadingAging(false);
    }
  };

  const openStatement = async (customer) => {
    setStatementCustomer(customer);
    setLoadingInvoices(true);
    setInvoices([]);
    try {
      const res = await fetch(`/api/customers/${customer.id}/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleCollectPayment = async (invoiceId) => {
    const amount = Number(payAmounts[invoiceId]);
    if (!amount || amount <= 0) return alert('Enter a valid payment amount.');
    try {
      const res = await fetch(`/api/customers/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: amount, payment_method: 'CASH' })
      });
      if (res.ok) {
        alert('Payment recorded!');
        setPayAmounts(prev => ({ ...prev, [invoiceId]: '' }));
        openStatement(statementCustomer); // refresh invoices
        fetchCustomers(); // refresh balances
      } else {
        const err = await res.json();
        alert('Failed: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className="customers-module">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Customers & Accounts Receivable</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Customer</button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', backgroundColor: 'var(--surface-color)', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add New Customer</h3>
            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required type="text" className="input-field" placeholder="Full Name or Company" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
              <select className="input-field" value={newCustomer.customer_type} onChange={(e) => setNewCustomer({...newCustomer, customer_type: e.target.value})}>
                <option value="RETAIL">Retail (Standard Walk-in)</option>
                <option value="CONTRACTOR">Contractor (Credit Line Account)</option>
              </select>
              <input type="text" className="input-field" placeholder="Contact Phone / Email" value={newCustomer.contact_details} onChange={(e) => setNewCustomer({...newCustomer, contact_details: e.target.value})} />
              <input type="text" className="input-field" placeholder="Address" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} />
              
              {newCustomer.customer_type === 'CONTRACTOR' && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Credit Limit</label>
                  <input required type="number" className="input-field" placeholder="Credit Limit Limit (₱)" value={newCustomer.credit_limit} onChange={(e) => setNewCustomer({...newCustomer, credit_limit: e.target.value})} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel text-center">
          <h3 className="text-muted">Total Outstanding A/R</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent)' }}>{formatPeso(totalAR)}</p>
        </div>
        <div className="glass-panel text-center">
          <h3 className="text-muted">Active Contractors</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{contractorCount}</p>
        </div>
        <div className="glass-panel text-center">
          <h3 className="text-muted">Overdue Invoices</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'red' }}>
            {customers.reduce((count, c) => {
              // Count customers with outstanding > 0 as potentially overdue (refined with real invoice data when aging tab loads)
              return count + (c.outstanding_balance > 0 ? 1 : 0);
            }, 0)}
          </p>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h4 onClick={() => { setActiveTab('list'); }} style={{ cursor: 'pointer', color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-muted)' }}>Customer Directory</h4>
        <h4 onClick={() => { setActiveTab('aging'); loadAgingReport(); }} style={{ cursor: 'pointer', color: activeTab === 'aging' ? 'var(--primary)' : 'var(--text-muted)' }}>A/R Aging Report</h4>
      </div>

      <div className="glass-panel table-container">
        {loading ? (
          <p>Loading records...</p>
        ) : (
          activeTab === 'list' ? (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>Customer Name</th>
                  <th style={{ padding: '12px' }}>Type</th>
                  <th style={{ padding: '12px' }}>Contact</th>
                  <th style={{ padding: '12px' }}>Credit Limit</th>
                  <th style={{ padding: '12px' }}>Outstanding Bal.</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}><strong>{c.name}</strong></td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                        backgroundColor: c.customer_type === 'CONTRACTOR' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: c.customer_type === 'CONTRACTOR' ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {c.customer_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{c.contact_details}</td>
                    <td style={{ padding: '12px' }}>{formatPeso(c.credit_limit)}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: c.outstanding_balance > (c.credit_limit * 0.8) ? 'var(--accent)' : 'inherit' }}>
                      {formatPeso(c.outstanding_balance)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openStatement(c)}>View Statement</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>Customer / Contractor</th>
                  <th style={{ padding: '12px' }}>Current</th>
                  <th style={{ padding: '12px' }}>1-30 Days</th>
                  <th style={{ padding: '12px' }}>31-60 Days</th>
                  <th style={{ padding: '12px' }}>61-90 Days</th>
                  <th style={{ padding: '12px' }}>&gt; 90 Days</th>
                  <th style={{ padding: '12px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingAging ? (
                  <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Computing aging buckets...</td></tr>
                ) : agingData.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No outstanding balances found.</td></tr>
                ) : agingData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}><strong>{row.name}</strong></td>
                    <td style={{ padding: '12px' }}>{row.current > 0 ? formatPeso(row.current) : '—'}</td>
                    <td style={{ padding: '12px' }}>{row['1-30'] > 0 ? formatPeso(row['1-30']) : '—'}</td>
                    <td style={{ padding: '12px', color: row['31-60'] > 0 ? 'var(--accent)' : 'inherit' }}>{row['31-60'] > 0 ? formatPeso(row['31-60']) : '—'}</td>
                    <td style={{ padding: '12px', color: row['61-90'] > 0 ? '#f97316' : 'inherit' }}>{row['61-90'] > 0 ? formatPeso(row['61-90']) : '—'}</td>
                    <td style={{ padding: '12px', color: row['90+'] > 0 ? '#ef4444' : 'inherit', fontWeight: row['90+'] > 0 ? 'bold' : 'normal' }}>{row['90+'] > 0 ? formatPeso(row['90+']) : '—'}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatPeso(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
      {statementCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '720px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--surface-color)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{statementCustomer.name}</h3>
                <p className="text-muted" style={{ margin: '4px 0 0' }}>{statementCustomer.customer_type} • Outstanding: <strong style={{ color: 'var(--accent)' }}>{formatPeso(statementCustomer.outstanding_balance)}</strong></p>
              </div>
              <button className="btn btn-outline" onClick={() => setStatementCustomer(null)}>✕ Close</button>
            </div>

            {loadingInvoices ? (
              <p>Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '32px' }}>No invoices found for this customer.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 8px' }}>Receipt #</th>
                    <th style={{ padding: '10px 8px' }}>Due Date</th>
                    <th style={{ padding: '10px 8px' }}>Amount Due</th>
                    <th style={{ padding: '10px 8px' }}>Remaining</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                    <th style={{ padding: '10px 8px' }}>Collect</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', fontSize: '13px' }}>{inv.transaction?.receipt_number || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 8px' }}>{formatPeso(inv.amount_due)}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: inv.remaining_balance > 0 ? 'var(--accent)' : 'var(--secondary)' }}>
                        {formatPeso(inv.remaining_balance)}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '10px', fontSize: '11px',
                          backgroundColor: inv.status === 'PAID' ? 'rgba(34,197,94,0.15)' : inv.status === 'PARTIAL' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                          color: inv.status === 'PAID' ? '#22c55e' : inv.status === 'PARTIAL' ? '#eab308' : '#ef4444'
                        }}>{inv.status}</span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {inv.status !== 'PAID' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="number"
                              className="input-field"
                              placeholder="₱ Amount"
                              style={{ width: '100px', padding: '4px 8px', fontSize: '12px' }}
                              value={payAmounts[inv.id] || ''}
                              onChange={e => setPayAmounts(prev => ({ ...prev, [inv.id]: e.target.value }))}
                            />
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => handleCollectPayment(inv.id)}
                            >Pay</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
