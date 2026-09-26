import React, { useState, useMemo } from 'react';
import { useApi } from "../../hooks/userApi.js";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import StatCard from "../../components/ui/StatCard";
import { Droplet, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, Search } from "lucide-react";

const InventoryPage = () => {
  const { data, loading, error, refetch } = useApi('blood/live-stock/');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Normalize stocks list whether response is array or object with stocks
  const stocksList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.stocks && Array.isArray(data.stocks)) return data.stocks;
    return [];
  }, [data]);

  const updatedAt = data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Just now';

  // Derived metrics
  const totalUnits = stocksList.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
  const criticalCount = stocksList.filter(s => (s.status || '').toLowerCase() === 'critical').length;
  const lowCount = stocksList.filter(s => (s.status || '').toLowerCase() === 'low').length;
  const normalCount = stocksList.filter(s => (s.status || '').toLowerCase() === 'normal').length;

  const filteredStocks = useMemo(() => {
    return stocksList.filter((item) => {
      const type = (item.bloodType || item.blood_group || '').toLowerCase();
      const status = (item.status || '').toUpperCase();
      const matchesSearch = type.includes(searchTerm.toLowerCase().trim());
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stocksList, searchTerm, statusFilter]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p className="text-muted">Loading live blood inventory...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <AlertTriangle size={36} color="var(--color-critical)" style={{ margin: '0 auto 12px' }} />
        <h3>Failed to load inventory</h3>
        <p className="text-muted">{error}</p>
        <button className="dashboard btn btn-primary" onClick={refetch} style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>National Live Blood Stock</h2>
          <p className="text-muted" style={{ margin: '4px 0 0' }}>
            Real-time aggregate stock levels across blood banks • Last updated: {updatedAt}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="dashboard btn btn-outline" 
            onClick={refetch} 
            title="Refresh Stock Data"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard 
          title="Total Blood Units"
          value={`${totalUnits} Units`}
          icon={Droplet}
          color="primary"
          subtitle="Available across all groups"
        />
        <StatCard 
          title="Optimal Stock Groups"
          value={normalCount}
          icon={ShieldCheck}
          color="success"
          subtitle="Groups at safe levels"
        />
        <StatCard 
          title="Low Stock Groups"
          value={lowCount}
          icon={AlertTriangle}
          color="warning"
          subtitle="Requires routine replenishment"
        />
        <StatCard 
          title="Critical Groups"
          value={criticalCount}
          icon={AlertTriangle}
          color="danger"
          subtitle="Immediate donor drive needed"
        />
      </div>

      {/* Live Inventory Table Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Stock Breakdown by Blood Group</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color, #e2e8f0)', padding: '6px 12px', borderRadius: '8px' }}>
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Search blood group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.875rem' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="dashboard btn btn-outline"
              style={{ padding: '6px 12px', borderRadius: '8px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <DataTable 
          columns={['Blood Group', 'Available Units', 'Status Indicator', 'Stock Level', 'Condition']}
          data={filteredStocks}
          emptyMessage="No matching blood stock records found."
          renderRow={(item, idx) => {
            const bloodType = item.bloodType || item.blood_group || 'Unknown';
            const units = Number(item.units || 0);
            const status = item.status || (units < 10 ? 'Critical' : units < 30 ? 'Low' : 'Normal');

            return (
              <tr key={bloodType || idx}>
                <td>
                  <span style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    padding: '6px 16px', 
                    borderRadius: '9999px', 
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.5px'
                  }}>
                    {bloodType}
                  </span>
                </td>
                <td>
                  <strong style={{ fontSize: '1.1rem' }}>{units}</strong> <span className="text-muted">units</span>
                </td>
                <td>
                  <StatusBadge status={status} />
                </td>
                <td style={{ minWidth: '150px' }}>
                  <div style={{ background: '#f1f5f9', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, Math.max(5, (units / 60) * 100))}%`, 
                        height: '100%', 
                        backgroundColor: status === 'Critical' ? '#ef4444' : status === 'Low' ? '#f59e0b' : '#10b981' 
                      }} 
                    />
                  </div>
                </td>
                <td>
                  <span className="text-muted text-sm">
                    {status === 'Critical' ? 'Urgent donations needed' : status === 'Low' ? 'Stock is running low' : 'Adequate supply'}
                  </span>
                </td>
              </tr>
            );
          }}
        />
      </div>
    </div>
  );
};

export default InventoryPage;