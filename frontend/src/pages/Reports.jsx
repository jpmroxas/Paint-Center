import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Briefcase, DollarSign } from 'lucide-react';
import { formatPeso } from '../utils/format';

// Simple SVG bar chart
const BarChart = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No sales data yet.</p>;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', padding: '8px 0' }}>
      {data.map((d, i) => {
        const pct = (d.total / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{formatPeso(d.total).replace('₱', '')}</span>
            <div style={{ width: '100%', height: `${Math.max(pct, 3)}%`, backgroundColor: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: 0.85, transition: 'height 0.4s ease' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const Reports = () => {
  const [metrics, setMetrics] = useState({ totalAR: 0, lowStockCount: 0, totalTransactions: 0, totalSalesRevenue: 0, totalExpenses: 0 });
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, salesRes, expRes] = await Promise.allSettled([
          fetch('/api/reports/dashboard'),
          fetch('/api/sales'),
          fetch('/api/expenses')
        ]);
        
        if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
          const data = await dashRes.value.json();
          let totalExpenses = 0;
          if (expRes.status === 'fulfilled' && expRes.value.ok) {
             const expenses = await expRes.value.json();
             totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
          }
          setMetrics({ ...data.metrics, totalExpenses });
          setTopProducts(data.topProducts);
          setLowStockItems(data.lowStockItems);
        }
        
        if (salesRes.status === 'fulfilled' && salesRes.value.ok) {
          const sales = await salesRes.value.json();
          // Build last 7 days chart
          const days = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-PH', { weekday: 'short' });
            const dateStr = d.toISOString().slice(0, 10);
            const total = sales
              .filter(s => s.created_at.slice(0, 10) === dateStr)
              .reduce((sum, s) => sum + (s.net_amount || 0), 0);
            days.push({ label, total });
          }
          setChartData(days);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="reports-module">
      <div className="header-actions" style={{ marginBottom: '24px' }}>
        <h2>Analytics Dashboard</h2>
        <p className="text-muted">Real-time overview of your store's performance.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel text-center hover-lift" style={{ borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--primary)' }}><DollarSign size={28} /></div>
          <h3 className="text-muted" style={{ fontSize: '14px' }}>Gross Revenue (All Time)</h3>
          <p style={{ fontSize: '26px', fontWeight: 'bold' }}>{formatPeso(metrics.totalSalesRevenue)}</p>
        </div>
        <div className="glass-panel text-center hover-lift" style={{ borderTop: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--accent)' }}><Briefcase size={28} /></div>
          <h3 className="text-muted" style={{ fontSize: '14px' }}>Outstanding A/R Debt</h3>
          <p style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--accent)' }}>{formatPeso(metrics.totalAR)}</p>
        </div>
        <div className="glass-panel text-center hover-lift" style={{ borderTop: '4px solid var(--secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--secondary)' }}><TrendingUp size={28} /></div>
          <h3 className="text-muted" style={{ fontSize: '14px' }}>Total Transactions</h3>
          <p style={{ fontSize: '26px', fontWeight: 'bold' }}>{metrics.totalTransactions.toLocaleString()}</p>
        </div>
        <div className="glass-panel text-center hover-lift" style={{ borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: '#10b981' }}><DollarSign size={28} /></div>
          <h3 className="text-muted" style={{ fontSize: '14px' }}>Net Profit (Store Health)</h3>
          <p style={{ fontSize: '26px', fontWeight: 'bold', color: '#10b981' }}>{formatPeso(metrics.totalSalesRevenue - metrics.totalExpenses)}</p>
        </div>
      </div>

      {/* 7-Day Sales Chart */}
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Sales — Last 7 Days</h3>
        <BarChart data={chartData} />
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '16px' }}>Top Selling Products</h3>
          {!loading && topProducts.length === 0
            ? <p className="text-muted">No sales recorded yet.</p>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '8px' }}>Product</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty Sold</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px' }}><strong>{p.name}</strong></td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.qty_sold}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--secondary)', fontWeight: 'bold' }}>{formatPeso(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '16px', color: lowStockItems.length > 0 ? '#ef4444' : 'inherit' }}>
            {lowStockItems.length > 0 ? `⚠ Action Required: ${lowStockItems.length} Low Stock` : '✓ Stock Levels OK'}
          </h3>
          {lowStockItems.length === 0
            ? <p className="text-muted">All products are sufficiently stocked.</p>
            : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {lowStockItems.map((item, idx) => (
                  <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.name}</span>
                    <span>
                      <strong style={{ color: '#ef4444' }}>{item.stock}</strong>
                      <span className="text-muted" style={{ fontSize: '12px' }}> / {item.reorder_level} min</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
