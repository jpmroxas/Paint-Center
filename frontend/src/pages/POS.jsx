import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Search, Trash2, CheckCircle, ChevronDown, X, PaintBucket, Percent } from 'lucide-react';
import { useCart } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import { formatPeso } from '../utils/format';

const POS = () => {
  const { cart, removeFromCart, clearCart, addToCart, updateQty } = useCart();
  const navigate = useNavigate();

  // Core Data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Search & Results
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Transaction States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');

  // UI States
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showDiscountPanel, setShowDiscountPanel] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  const searchInputRef = useRef(null);

  // 1. Initial Load
  const loadData = useCallback(async () => {
    try {
      const [custRes, prodRes, setRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/inventory/products'),
        fetch('/api/settings')
      ]);
      if (custRes.ok) setCustomers(await custRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (setRes.ok) setStoreSettings(await setRes.json());
    } catch (e) {
      console.error('Could not load POS data', e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 2. Checkout Logic
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const computedDiscount = (() => {
    if (!discountValue || Number(discountValue) <= 0) return 0;
    if (discountType === 'percent') return (subtotal * Math.min(Number(discountValue), 100)) / 100;
    return Math.min(Number(discountValue), subtotal);
  })();
  const total = subtotal - computedDiscount;

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return alert('Cart is empty');
    try {
      const response = await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id || null,
          items: cart.map(item => ({ product_id: item.product_id || item.id, qty: item.qty, price: item.price })),
          payment_method: paymentMethod,
          discount: computedDiscount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastTransaction(data.transaction);
        setShowSuccessModal(true);
        clearCart();
        setSelectedCustomer(null);
        setDiscountValue('');
        setPaymentMethod('CASH');
      } else {
        const err = await response.json();
        alert('Checkout Failed: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error connecting to the server during checkout.');
    }
  }, [cart, selectedCustomer, paymentMethod, computedDiscount, clearCart]);

  // 3. Receipt Printing
  const handlePrintReceipt = (txn) => {
    if (!txn || !txn.items) return;
    const win = window.open('', '_blank');
    const itemsHtml = txn.items.map(i =>
      `<tr>
        <td style="padding:6px 0;">${i.product?.name || 'Item'}</td>
        <td style="padding:6px 0;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 0;text-align:right;">₱${Number(i.unit_price).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
        <td style="padding:6px 0;text-align:right;font-weight:bold;">₱${Number(i.subtotal).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
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
          <tbody>${itemsHtml}</tbody>
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

  // 4. Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) { e.preventDefault(); handleCheckout(); }
      if (e.key === 'Escape') {
        setSearchTerm('');
        setShowResults(false);
        setShowCustomerPicker(false);
        setShowDiscountPanel(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCheckout]);

  // 5. Search Filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.brand && p.brand.toLowerCase().includes(lower)) ||
      (p.barcode && p.barcode.includes(searchTerm))
    );
    setSearchResults(filtered.slice(0, 10));
    setShowResults(filtered.length > 0);
  }, [searchTerm, products]);

  const handleAddProduct = (product) => {
    addToCart({ item_id: product.id, product_id: product.id, name: product.name, unit: product.unit, qty: 1, price: product.selling_price });
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));

  return (
    <div className="pos-module split-layout">
      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div className="glass-panel text-center" style={{ width: '400px', backgroundColor: 'var(--surface-color)', padding: '40px', border: '1px solid var(--primary)' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><CheckCircle size={80} /></div>
            <h2 style={{ marginBottom: '8px' }}>Payment Successful</h2>
            <p className="text-muted" style={{ marginBottom: '24px' }}>Invoice {lastTransaction?.receipt_number} has been recorded.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" style={{ padding: '14px', fontSize: '16px' }} onClick={() => handlePrintReceipt(lastTransaction)}>
                Print Official Receipt
              </button>
              <button className="btn btn-outline" style={{ padding: '12px' }} onClick={() => setShowSuccessModal(false)}>
                Continue to Next Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PICKER MODAL */}
      {showCustomerPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '420px', backgroundColor: 'var(--surface-color)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Select Customer</h3>
              <button className="btn" onClick={() => setShowCustomerPicker(false)}><X size={20} /></button>
            </div>
            <input autoFocus type="text" className="input-field" placeholder="Search customer name..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} style={{ marginBottom: '12px' }} />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div onClick={() => { setSelectedCustomer(null); setPaymentMethod('CASH'); setShowCustomerPicker(false); }}
                style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: !selectedCustomer ? 'rgba(37,99,235,0.1)' : 'var(--bg-color)', marginBottom: '4px', border: '1px solid var(--border-color)' }}>
                <strong>Walk-in Customer</strong>
              </div>
              {filteredCustomers.map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerPicker(false); }}
                  style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedCustomer?.id === c.id ? 'rgba(37,99,235,0.1)' : 'var(--bg-color)', marginBottom: '4px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>{c.name}</strong><br/><small>{c.customer_type}</small></div>
                  {c.outstanding_balance > 0 && <small style={{ color: 'var(--accent)' }}>{formatPeso(c.outstanding_balance)} owed</small>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEFT PANE - Search & Cart */}
      <div className="left-pane glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="search-bar" style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input ref={searchInputRef} type="text" className="input-field" placeholder="Search product or scan barcode [F3]..." style={{ paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          
          {showResults && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '350px', overflowY: 'auto', marginTop: '4px' }}>
              {searchResults.map(p => (
                <div key={p.id} onMouseDown={() => handleAddProduct(p)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }} className="search-result-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <small className="text-muted">{p.brand} • {p.unit} • Stock: {p.stock_quantity}</small>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{formatPeso(p.selling_price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-area" style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.5 }}><ShoppingCart size={64} style={{ marginBottom: '16px' }} /><p>Cart is empty</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
                <tr><th style={{ textAlign: 'left', padding: '12px' }}>Product</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right', paddingRight: '12px' }}>Total</th><th /></tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}><strong>{item.name}</strong><br/><small className="text-muted">{item.unit}</small></td>
                    <td style={{ textAlign: 'center' }}><input type="number" className="input-field" value={item.qty} min="1" style={{ width: '50px', padding: '4px', textAlign: 'center' }} onChange={e => updateQty(idx, e.target.value)} /></td>
                    <td style={{ textAlign: 'right' }}>{formatPeso(item.price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatPeso(item.price * item.qty)}</td>
                    <td style={{ textAlign: 'center' }}><button onClick={() => removeFromCart(idx)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT PANE - Checkout */}
      <div className="right-pane glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><h3>Customer</h3><button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setShowCustomerPicker(true)}>Change</button></div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
            <strong>{selectedCustomer?.name || 'Walk-in Customer'}</strong>
            {selectedCustomer?.customer_type === 'CONTRACTOR' && <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>Debt: {formatPeso(selectedCustomer.outstanding_balance)} / Limit: {formatPeso(selectedCustomer.credit_limit)}</div>}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>Payment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['CASH', 'GCASH', 'BANK', 'CREDIT'].map(m => (
              <button key={m} className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-outline'}`} disabled={m === 'CREDIT' && selectedCustomer?.customer_type !== 'CONTRACTOR'} onClick={() => setPaymentMethod(m)} style={{ padding: '10px' }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button className={`btn ${showDiscountPanel ? 'btn-primary' : 'btn-outline'}`} style={{ height: '60px', flexDirection: 'column' }} onClick={() => setShowDiscountPanel(!showDiscountPanel)}><Percent size={18} /><span>Discount</span></button>
          <button className="btn btn-outline" style={{ height: '60px', flexDirection: 'column', color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => navigate('/mixing')}><PaintBucket size={18} /><span>Mix Paint</span></button>
        </div>

        {showDiscountPanel && (
          <div style={{ marginBottom: '20px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button className={`btn ${discountType === 'percent' ? 'btn-primary' : 'btn-outline'}`} flex="1" onClick={() => setDiscountType('percent')}>%</button>
              <button className={`btn ${discountType === 'flat' ? 'btn-primary' : 'btn-outline'}`} flex="1" onClick={() => setDiscountType('flat')}>₱</button>
              <input type="number" className="input-field" style={{ flex: 2 }} placeholder="Val" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            </div>
            {computedDiscount > 0 && <small style={{ color: 'var(--secondary)' }}>Less {formatPeso(computedDiscount)}</small>}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}><span>Subtotal</span><span>{formatPeso(subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--secondary)' }}><span>Discount</span><span>-{formatPeso(computedDiscount)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}><span>Total</span><span style={{ color: 'var(--primary)' }}>{formatPeso(total)}</span></div>
          <button className="btn btn-primary" style={{ width: '100%', height: '60px', fontSize: '18px', marginTop: '20px' }} onClick={handleCheckout}><CheckCircle size={24} /> Pay Now [F12]</button>
        </div>
      </div>
    </div>
  );
};

export default POS;
