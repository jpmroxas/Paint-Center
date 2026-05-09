import React, { useState, useEffect } from 'react';
import { formatPeso } from '../utils/format';
import { Receipt } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const [txnRes, setRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/settings')
        ]);
        if (txnRes.ok) setTransactions(await txnRes.json());
        if (setRes.ok) setStoreSettings(await setRes.json());
      } catch (e) {
        console.error('Failed to load data in Transactions', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const statusColor = (s) => s === 'COMPLETED' ? '#22c55e' : s === 'RETURNED' ? '#f59e0b' : '#ef4444';
  const methodBadge = (m) => {
    const colors = { CASH: '#3b82f6', GCASH: '#10b981', BANK: '#8b5cf6', CREDIT: '#f59e0b' };
    return colors[m] || '#64748b';
  };

  const handlePrint = (txn) => {
    const win = window.open('', '_blank');
    const items = txn.items.map(i =>
      `<tr>
        <td style="padding:6px 8px;">${i.product?.name || 'Unknown'}</td>
        <td style="padding:6px 8px;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 8px;text-align:right;">₱${Number(i.unit_price).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
        <td style="padding:6px 8px;text-align:right;">₱${Number(i.subtotal).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
      </tr>`
    ).join('');
    win.document.write(`
      <html><head><title>Receipt ${txn.receipt_number}</title>
      <style>body{font-family:monospace;padding:10px;width:300px;margin:0 auto;color:#000;}
      table{width:100%;border-collapse:collapse;margin-top:10px;}th{border-bottom:1px dashed #000;padding:5px 0;text-align:left;font-size:12px;}
      td{font-size:11px;}.total{border-top:1px dashed #000;font-weight:bold;margin-top:10px;text-align:right;font-size:14px;}
      .header{text-align:center;margin-bottom:10px;}.text-right{text-align:right;}.text-small{font-size:10px;}</style></head>
      <body>
        <div class="header">
          <h2 style="margin:0;">${storeSettings?.STORE_NAME || 'PaintCenter'}</h2>
          <p class="text-small">${storeSettings?.STORE_ADDRESS || 'Batangas City, PH'}</p>
          <p class="text-small">Tel: ${storeSettings?.CONTACT_PHONE || '0917-XXX-XXXX'}</p>
        </div>
        <div class="text-small">
          <b>OR #:</b> ${txn.receipt_number}<br/>
          <b>Date:</b> ${new Date(txn.created_at).toLocaleString()}<br/>
          <b>Cashier:</b> Admin<br/>
          <b>Customer:</b> ${txn.customer?.name || 'Walk-in'}
        </div>
        <table>
          <thead><tr><th>ITEM</th><th style="text-align:center;">QTY</th><th style="text-align:right;">PRICE</th><th style="text-align:right;">TOTAL</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
        <div style="margin-top:10px;">
          ${txn.discount > 0 ? `<div class="text-small text-right">Subtotal: ₱${Number(txn.total_amount).toLocaleString('en-PH',{minimumFractionDigits:2})}</div>
          <div class="text-small text-right">Discount: -₱${Number(txn.discount).toLocaleString('en-PH',{minimumFractionDigits:2})}</div>` : ''}
          <div class="total">TOTAL: ₱${Number(txn.net_amount).toLocaleString('en-PH',{minimumFractionDigits:2})}</div>
        </div>
        <p style="text-align:center;margin-top:20px;font-size:10px;border-top:1px dashed #000;padding-top:10px;">
          ${storeSettings?.RECEIPT_FOOTER || 'Thank you! Come again.'}
        </p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <div className="header-actions" style={{ marginBottom: '24px' }}>
        <h2>Transaction History</h2>
      </div>

      {/* Detail Modal */}
      {selectedTxn && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--surface-color)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Receipt #{selectedTxn.receipt_number}</h3>
                <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {new Date(selectedTxn.created_at).toLocaleString()} &bull; {selectedTxn.payment_method}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handlePrint(selectedTxn)}>
                  🖨 Print
                </button>
                <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setSelectedTxn(null)}>✕</button>
              </div>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
              <p><strong>Customer:</strong> {selectedTxn.customer?.name || 'Walk-in'}</p>
              <p><strong>Status:</strong> <span style={{ color: statusColor(selectedTxn.status) }}>{selectedTxn.status}</span></p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedTxn.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 8px' }}>{item.product?.name || 'Unknown'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatPeso(item.unit_price)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatPeso(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              {selectedTxn.discount > 0 && (
                <>
                  <p style={{ color: 'var(--text-muted)' }}>Subtotal: {formatPeso(selectedTxn.total_amount)}</p>
                  <p style={{ color: 'var(--secondary)' }}>Discount: -{formatPeso(selectedTxn.discount)}</p>
                </>
              )}
              <p style={{ fontSize: '22px', fontWeight: 'bold' }}>Total: {formatPeso(selectedTxn.net_amount)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel">
        {loading ? <p>Loading transactions...</p> : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Receipt size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No transactions yet. Make a sale to see records here.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Date & Time</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Receipt #</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Items</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Payment</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Total</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{new Date(txn.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px', fontWeight: '600', fontSize: '13px' }}>{txn.receipt_number}</td>
                  <td style={{ padding: '12px' }}>{txn.customer?.name || <span className="text-muted">Walk-in</span>}</td>
                  <td style={{ padding: '12px' }}>{txn.items.length} item{txn.items.length !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', backgroundColor: `${methodBadge(txn.payment_method)}22`, color: methodBadge(txn.payment_method), fontWeight: 600 }}>
                      {txn.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatPeso(txn.net_amount)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', backgroundColor: `${statusColor(txn.status)}22`, color: statusColor(txn.status), fontWeight: 600 }}>
                      {txn.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', display: 'flex', gap: '6px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSelectedTxn(txn)}>View</button>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handlePrint(txn)}>🖨</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
