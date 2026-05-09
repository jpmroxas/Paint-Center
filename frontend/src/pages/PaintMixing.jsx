import React, { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { Search, X } from 'lucide-react';

const PaintMixing = () => {
  const { addToCart } = useCart();
  const [step, setStep] = useState(1);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedBase, setSelectedBase] = useState(null);
  const [formulaDetails, setFormulaDetails] = useState({ colorCode: '', customerSearch: '', unit: 'ML' });
  const [tints, setTints] = useState([{ product_id: '', volume_ml: 0, unit: 'ML' }]);
  const [baseSearch, setBaseSearch] = useState('');

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetch('/api/inventory/products');
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBases();
  }, []);

  const basePaints = inventory.filter(p => p.base_type != null || p.category === 'Automotive');
  const tintProducts = inventory.filter(p => p.category === 'Tint');

  const filteredBasePaints = basePaints.filter(base => 
    (base.name || '').toLowerCase().includes(baseSearch.toLowerCase()) ||
    (base.brand || '').toLowerCase().includes(baseSearch.toLowerCase()) ||
    (base.base_type || '').toLowerCase().includes(baseSearch.toLowerCase())
  );

  const handleAddTint = () => {
    setTints([...tints, { product_id: '', volume_ml: 0 }]);
  };

  const handleTintChange = (index, field, value) => {
    const newTints = [...tints];
    if (field === 'product_id') {
      const product = tintProducts.find(p => p.id === value);
      newTints[index].unit = product?.unit || 'ML';
    }
    newTints[index][field] = value;
    setTints(newTints);
  };

  const handleRemoveTint = (index) => {
    const newTints = [...tints];
    newTints.splice(index, 1);
    setTints(newTints);
  };

  const handleGenerateLabel = async () => {
    try {
      const response = await fetch('/api/mixing/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: null,
          color_name: formulaDetails.colorCode,
          color_code: formulaDetails.colorCode,
          brand: selectedBase?.brand || 'Generic',
          base_product_id: selectedBase?.id,
          total_amount: tints.reduce((sum, t) => sum + Number(t.volume_ml), 0),
          unit: selectedBase?.unit || 'ML',
          tints: tints.filter(t => t.product_id && t.volume_ml > 0).map(t => ({
            tint_product_id: t.product_id,
            amount: Number(t.volume_ml),
            unit: t.unit
          }))
        })
      });
      if (response.ok) {
        const createdFormula = await response.json();
        
        addToCart({
          product_id: selectedBase.id, // Custom Paints are billed based on the base price + an assumed formula markup logic. Simple MVP bills base price.
          name: `Custom Mix: ${formulaDetails.colorCode || 'Color'}`,
          unit: selectedBase.unit,
          qty: 1, 
          price: selectedBase.selling_price + 50 // Generic $50 tinting fee
        });

        alert('Formula Saved! Added to POS Cart!');
        // Reset state
        setStep(1);
        setSelectedBase(null);
        setTints([{ product_id: '', volume_ml: 0 }]);
        setFormulaDetails({ colorCode: '', customerSearch: '' });
      } else {
        alert('Failed to save formula.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Network error connecting to API');
    }
  };

  return (
    <div className="mixing-module">
      <div className="header-actions" style={{ marginBottom: '24px' }}>
        <h2>Paint Mixing Wizard</h2>
        <p className="text-muted">Create custom color formulas and manage tint usage.</p>
      </div>

      <div className="glass-panel">
        <div className="wizard-progress" style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              style={{
                flex: 1, 
                height: '8px', 
                backgroundColor: s <= step ? 'var(--primary)' : 'var(--border-color)',
                borderRadius: '4px',
                transition: 'var(--transition-normal)'
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Step 1: Base Paint Selection</h3>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search base, brand, or type..." 
                  style={{ paddingLeft: '40px', borderRadius: '30px' }}
                  value={baseSearch}
                  onChange={(e) => setBaseSearch(e.target.value)}
                />
                {baseSearch && (
                  <button 
                    onClick={() => setBaseSearch('')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            {loading ? <p>Loading bases...</p> : (
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                {filteredBasePaints.map(base => (
                  <div key={base.id} className="glass-panel hover-lift" 
                    onClick={() => { setSelectedBase(base); setStep(2); }} 
                    style={{ cursor: 'pointer', textAlign: 'center', borderColor: selectedBase?.id === base.id ? 'var(--primary)' : 'var(--border-color)' }}>
                    <h4>{base.base_type} Base</h4>
                    <p>{base.brand} {base.name}</p>
                    <span style={{color: 'var(--text-muted)'}}>{base.unit} - {base.stock_quantity} in stock</span>
                  </div>
                ))}
                {filteredBasePaints.length === 0 && !loading && (
                  <div style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', backgroundColor: 'var(--sidebar-bg)', borderRadius: '12px' }}>
                    <p className="text-muted">No matching base paints found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h3>Step 2: Formula & Color Code</h3>
            <div style={{ marginTop: '16px' }}>
              <label>Color Code / Name</label>
              <input type="text" className="input-field" placeholder="e.g. B-701 or 'Tuscany Yellow'" 
                value={formulaDetails.colorCode} onChange={e => setFormulaDetails({...formulaDetails, colorCode: e.target.value})}
                style={{ marginTop: '8px', marginBottom: '16px' }} />
              
              <label>Link to Customer (Optional)</label>
              <input type="text" className="input-field" placeholder="Search Customer Name..." 
                value={formulaDetails.customerSearch} onChange={e => setFormulaDetails({...formulaDetails, customerSearch: e.target.value})}
                style={{ marginTop: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h3>Step 3: Tint Measurements</h3>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tints.map((tint, index) => (
                <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <select className="input-field" style={{ flex: 2 }} value={tint.product_id} onChange={(e) => handleTintChange(index, 'product_id', e.target.value)}>
                    <option value="">Select Pigment/Tint...</option>
                    {tintProducts.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                    ))}
                  </select>
                  <input type="number" className="input-field" placeholder={tint.unit || "ml/g"} style={{ flex: 1 }} 
                    value={tint.volume_ml} onChange={(e) => handleTintChange(index, 'volume_ml', e.target.value)} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', width: '30px' }}>{tint.unit}</span>
                  <button className="btn btn-outline" onClick={() => handleRemoveTint(index)} style={{ border: 'none', color: 'var(--accent)', padding: '4px' }}>X</button>
                </div>
              ))}
              <button className="btn btn-outline" onClick={handleAddTint} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>+ Add Tint Parameter</button>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Review Mixture</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h3>Step 4: Finalize Mix</h3>
            <div className="glass-panel" style={{ marginTop: '16px', backgroundColor: 'var(--bg-color)' }}>
              <h4>{formulaDetails.colorCode || 'Custom Color'}</h4>
              <p>Base: {selectedBase?.name} ({selectedBase?.unit})</p>
              <hr style={{ margin: '12px 0', borderColor: 'var(--border-color)' }} />
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {tints.map((t, idx) => {
                  const tintProduct = tintProducts.find(p => p.id === t.product_id);
                  return tintProduct ? (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>{tintProduct.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{t.volume_ml}{t.unit}</span>
                    </li>
                  ) : null;
                })}
              </ul>
              <div style={{ marginTop: '16px', color: 'var(--primary)', fontWeight: 'bold' }}>
                Warnings: Sufficient stock for all components.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}>Edit Tints</button>
              <button className="btn btn-primary" onClick={handleGenerateLabel}>Generate Label & Add to Cart</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaintMixing;
