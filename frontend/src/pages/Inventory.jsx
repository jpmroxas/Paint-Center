import React, { useState, useEffect } from 'react';
import { formatPeso } from '../utils/format';
import Barcode from 'react-barcode';
import { Printer, Tag, X } from 'lucide-react';
const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', category: 'Paint', brand: '', base_type: '', unit: 'GALLON',
    cost_price: 0, selling_price: 0, stock_quantity: 0, reorder_level: 10, barcode: ''
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/products');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: 'Paint', brand: '', base_type: '', unit: 'GALLON',
      cost_price: 0, selling_price: 0, stock_quantity: 0, reorder_level: 10, barcode: '' });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, category: product.category || 'Paint', brand: product.brand || '',
      base_type: product.base_type || '', unit: product.unit || 'GALLON',
      cost_price: product.cost_price, selling_price: product.selling_price,
      stock_quantity: product.stock_quantity, reorder_level: product.reorder_level,
      barcode: product.barcode || ''
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        stock_quantity: Number(formData.stock_quantity),
        reorder_level: Number(formData.reorder_level)
      };
      if (!payload.barcode) delete payload.barcode;
      if (!payload.base_type) payload.base_type = null;

      const isEdit = !!editingProduct;
      const response = await fetch(
        isEdit ? `/api/inventory/products/${editingProduct.id}` : '/api/inventory/products',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (response.ok) {
        setShowModal(false);
        fetchInventory();
      } else {
        const err = await response.json();
        alert('Failed: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to the server');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/inventory/products/${product.id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchInventory();
      } else {
        alert('Failed to delete product. It may be linked to existing sales.');
      }
    } catch (error) {
      alert('Network error while deleting.');
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="inventory-module">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Inventory Dashboard</h2>
          <p className="text-muted">Manage your stock, categories, and pricing.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search name, brand or category..." 
            style={{ width: '300px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Product</button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '540px', backgroundColor: 'var(--surface-color)', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>{editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input required type="text" className="input-field" placeholder="Product Name" value={formData.name} onChange={set('name')} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input required type="text" className="input-field" placeholder="Brand" value={formData.brand} onChange={set('brand')} />
                <select className="input-field" value={formData.category} onChange={set('category')}>
                  <option>Paint</option>
                  <option>Tint</option>
                  <option>Automotive</option>
                  <option>Tool</option>
                  <option>Sundry</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" className="input-field" placeholder="Base Type (e.g. White)" value={formData.base_type} onChange={set('base_type')} />
                <select className="input-field" value={formData.unit} onChange={set('unit')}>
                  <option>GALLON</option>
                  <option>LITER</option>
                  <option>ML</option>
                  <option>GRAM</option>
                  <option>KG</option>
                  <option>PCS</option>
                  <option>PAIL</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Cost Price (₱)</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.cost_price} onChange={set('cost_price')} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Selling Price (₱)</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.selling_price} onChange={set('selling_price')} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{editingProduct ? 'Current Stock' : 'Initial Stock'}</label>
                  <input required type="number" step="0.01" className="input-field" value={formData.stock_quantity} onChange={set('stock_quantity')} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Reorder Level</label>
                  <input required type="number" className="input-field" value={formData.reorder_level} onChange={set('reorder_level')} />
                </div>
              </div>
              <input type="text" className="input-field" placeholder="Barcode (optional)" value={formData.barcode} onChange={set('barcode')} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Modal */}
      {showBarcodeModal && selectedProductForLabel && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '350px', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Item Label</h3>
              <button onClick={() => setShowBarcodeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div id="thermal-label" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '20px', color: '#000' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>{selectedProductForLabel.name}</p>
              <Barcode value={selectedProductForLabel.barcode || selectedProductForLabel.id.slice(0, 8) || '00000'} width={1.5} height={50} fontSize={12} />
              <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>{formatPeso(selectedProductForLabel.selling_price)}</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => window.print()}>
              <Printer size={18} /> Print Thermal Label
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel table-container">
        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Name</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Category & Brand</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Unit</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Cost Price</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Selling Price</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Stock</th>
                <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const isLowStock = product.stock_quantity <= product.reorder_level;
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{product.name}</strong><br/>
                      <small className="text-muted">{product.base_type ? `${product.base_type} Base` : ''}</small>
                    </td>
                    <td style={{ padding: '12px' }}>{product.category} - {product.brand}</td>
                    <td style={{ padding: '12px' }}>{product.unit}</td>
                    <td style={{ padding: '12px' }}>{formatPeso(product.cost_price)}</td>
                    <td style={{ padding: '12px' }}>{formatPeso(product.selling_price)}</td>
                    <td style={{ padding: '12px', color: isLowStock ? 'var(--accent)' : 'inherit', fontWeight: isLowStock ? 'bold' : 'normal' }}>
                      {product.stock_quantity}
                      {isLowStock && <span className="badge-danger" style={{ marginLeft: '6px' }}>Low</span>}
                    </td>
                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => { setSelectedProductForLabel(product); setShowBarcodeModal(true); }}>
                        <Tag size={14} /> Label
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => openEditModal(product)}>Edit</button>
                      <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleDeleteProduct(product)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
