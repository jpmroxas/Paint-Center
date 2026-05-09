import React, { useState, useEffect } from 'react';
import { formatPeso } from '../utils/format';
import { Package, Truck, Check } from 'lucide-react';

const Purchasing = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [newPO, setNewPO] = useState({ supplier_id: '', items: [] });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [orderCost, setOrderCost] = useState(0);

  const fetchData = async () => {
    try {
      const [poRes, prodRes, supRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/inventory/products'),
        fetch('/api/suppliers')
      ]);
      if (poRes.ok) setPurchaseOrders(await poRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === selectedProduct);
    const item = { product_id: prod.id, name: prod.name, qty: Number(orderQty), cost: Number(orderCost) || prod.cost_price };
    setNewPO({ ...newPO, items: [...newPO.items, item] });
    setSelectedProduct('');
    setOrderQty(1);
    setOrderCost(0);
  };

  const handleCreatePO = async () => {
    if (!newPO.supplier_id || newPO.items.length === 0) return alert('Select supplier and add items');
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPO)
      });
      if (res.ok) {
        setShowModal(false);
        setNewPO({ supplier_id: '', items: [] });
        fetchData();
      }
    } catch (e) {
      alert('Error creating PO');
    }
  };

  const handleReceivePO = async (id) => {
    if (!window.confirm('Receive this order? Inventory stock will be increased.')) return;
    try {
      const res = await fetch(`/api/purchases/${id}/receive`, { method: 'POST' });
      if (res.ok) fetchData();
      else alert('Failed to receive order');
    } catch (e) {
      alert('Network error receive');
    }
  };

  const removeItem = (idx) => {
    const list = [...newPO.items];
    list.splice(idx, 1);
    setNewPO({ ...newPO, items: list });
  };

  return (
    <div className="purchasing-module">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2>Purchasing & Receiving</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Purchase Order</button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '600px', backgroundColor: 'var(--surface-color)', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Create Purchase Order</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>1. Select Supplier</label>
              <select className="input-field" value={newPO.supplier_id} onChange={e => setNewPO({...newPO, supplier_id: e.target.value})}>
                <option value="">— Choose Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>2. Add Items to Order</label>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' }}>
                <select className="input-field" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                  <option value="">Select Item</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
                <input type="number" className="input-field" placeholder="Qty" value={orderQty} onChange={e => setOrderQty(e.target.value)} />
                <input type="number" className="input-field" placeholder="Cost" value={orderCost} onChange={e => setOrderCost(e.target.value)} />
                <button type="button" className="btn btn-primary" onClick={addItem}>Add</button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Cost</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {newPO.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px' }}>{item.name}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{formatPeso(item.cost)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatPeso(item.qty * item.cost)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {newPO.items.length === 0 && <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No items added yet</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <div style={{ marginRight: 'auto', fontWeight: 'bold' }}>
                Est. Total: {formatPeso(newPO.items.reduce((sum, i) => sum + (i.qty * i.cost), 0))}
              </div>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreatePO} disabled={newPO.items.length === 0}>Submit Order</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel">
        {loading ? <p>Loading POs...</p> : purchaseOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Truck size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No purchase orders yet. Restock your inventory by creating one.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>PO Number</th>
                <th style={{ padding: '12px' }}>Supplier</th>
                <th style={{ padding: '12px' }}>Total Cost</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => (
                <tr key={po.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}><strong>{po.po_number}</strong></td>
                  <td style={{ padding: '12px' }}>{po.supplier?.name}</td>
                  <td style={{ padding: '12px' }}>{formatPeso(po.total_cost)}</td>
                  <td style={{ padding: '12px' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, backgroundColor: po.status === 'RECEIVED' ? '#22c55e22' : '#f59e0b22', color: po.status === 'RECEIVED' ? '#22c55e' : '#f59e0b' }}>
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {po.status === 'PENDING' ? (
                      <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#22c55e', borderColor: '#22c55e' }} onClick={() => handleReceivePO(po.id)}>
                        <Check size={14} /> Receive Items
                      </button>
                    ) : <span className="text-muted" style={{ fontSize: '12px' }}>Inventory Added</span>}
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

export default Purchasing;
