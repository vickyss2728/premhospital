import React, { useState } from 'react';
import {
  IndianRupee,
  Activity,
  Clock,
  AlertCircle,
  Plus,
  TrendingUp
} from 'lucide-react';
import type { Invoice, Service } from '../data/mockData';

/**
 * EXPLANATION: React Props
 * Props (short for properties) are inputs passed into a React component. They act 
 * like arguments to a function, allowing you to pass data from a parent component 
 * down to child components.
 * 
 * In TypeScript, we define an interface for our props to ensure compile-time safety.
 */
interface DashboardProps {
  invoices: Invoice[];
  services: Service[];
  onNavigate: (view: 'dashboard' | 'invoices' | 'new-invoice' | 'services') => void;
  onSelectInvoice: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  services,
  onNavigate,
  onSelectInvoice
}) => {

  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Filter for pharmacy medicines that are out of stock or low stock (under 10 units)
  const lowStockMedicines = (services || [])
    .filter(srv => srv.category === 'Pharmacy & Medicines' && srv.stock !== undefined && srv.stock < 10)
    .sort((a, b) => (a.stock || 0) - (b.stock || 0));

  // Extract unique years from ALL invoices
  const uniqueYears = Array.from(
    new Set(invoices.map(inv => new Date(inv.createdAt).getFullYear()))
  ).sort((a, b) => b - a);

  // Filter invoices for all dashboard widgets based on the selected year
  const activeInvoices = invoices.filter(inv => {
    if (selectedYear === 'all') return true;
    return new Date(inv.createdAt).getFullYear().toString() === selectedYear;
  });

  // Calculate aggregate stats
  const totalBilling = activeInvoices.reduce((acc, inv) => acc + (inv.subtotal - inv.discount + inv.tax), 0);

  const totalCollected = activeInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((acc, inv) => acc + (inv.subtotal - inv.discount + inv.tax), 0);

  const totalPending = activeInvoices
    .filter(inv => inv.status === 'pending')
    .reduce((acc, inv) => acc + inv.amountDue, 0);

  const totalOverdue = activeInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((acc, inv) => acc + inv.amountDue, 0);

  // Calculate billing by medical category for the chart
  const categoryTotals: Record<string, number> = {
    'Consultation & Visits': 0,
    'Clinical Procedures': 0,
    'Diagnostics & Labs': 0,
    'Pharmacy & Medicines': 0,
    'General Charges': 0
  };

  activeInvoices.forEach(inv => {
    inv.items.forEach(item => {
      if (categoryTotals[item.category] !== undefined) {
        categoryTotals[item.category] += item.amount;
      }
    });
  });

  const maxCategoryValue = Math.max(...Object.values(categoryTotals), 1);

  // Calculate collections by payment method
  const cashTotal = activeInvoices
    .filter(inv => inv.status === 'paid' && inv.paymentMethod === 'Cash')
    .reduce((acc, inv) => acc + (inv.subtotal - inv.discount + inv.tax), 0);

  const gpayTotal = activeInvoices
    .filter(inv => inv.status === 'paid' && inv.paymentMethod === 'GPay')
    .reduce((acc, inv) => acc + (inv.subtotal - inv.discount + inv.tax), 0);

  const pendingTotal = activeInvoices
    .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((acc, inv) => acc + inv.amountDue, 0);

  const [reportPeriod, setReportPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Group invoices by Month
  const monthlyData: Record<string, { billed: number; collected: number; outstanding: number; label: string; key: string }> = {};
  // Group invoices by Year
  const yearlyData: Record<string, { billed: number; collected: number; outstanding: number; label: string; key: string }> = {};

  activeInvoices.forEach(inv => {
    const date = new Date(inv.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const totalVal = inv.subtotal - inv.discount + inv.tax;

    // Monthly aggregation
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        billed: 0,
        collected: 0,
        outstanding: 0,
        label: monthLabel,
        key: monthKey
      };
    }

    monthlyData[monthKey].billed += totalVal;
    if (inv.status === 'paid') {
      monthlyData[monthKey].collected += totalVal;
    } else {
      monthlyData[monthKey].outstanding += inv.amountDue;
    }

    // Yearly aggregation
    const yearKey = `${year}`;
    const yearLabel = `Year ${year}`;

    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = {
        billed: 0,
        collected: 0,
        outstanding: 0,
        label: yearLabel,
        key: yearKey
      };
    }

    yearlyData[yearKey].billed += totalVal;
    if (inv.status === 'paid') {
      yearlyData[yearKey].collected += totalVal;
    } else {
      yearlyData[yearKey].outstanding += inv.amountDue;
    }
  });

  const monthlyReports = Object.values(monthlyData)
    .sort((a, b) => b.key.localeCompare(a.key))
    .map(report => ({
      key: report.key,
      label: report.label,
      billed: report.billed,
      collected: report.collected,
      outstanding: report.outstanding,
      clearanceRate: report.billed > 0 ? (report.collected / report.billed) * 100 : 100
    }));

  const yearlyReports = Object.values(yearlyData)
    .sort((a, b) => b.key.localeCompare(a.key))
    .map(report => ({
      key: report.key,
      label: report.label,
      billed: report.billed,
      collected: report.collected,
      outstanding: report.outstanding,
      clearanceRate: report.billed > 0 ? (report.collected / report.billed) * 100 : 100
    }));

  // Get most recent 3 active invoices
  const recentInvoices = [...activeInvoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }} className="gradient-text">Prem Hospital Billing Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Overview of patient treatments, clinic billing, and schemes for Vadipatti.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Global Year Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Year Filter:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                padding: '6px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                height: '38px',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontWeight: 500
              }}
            >
              <option value="all">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('new-invoice')}>
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="stats-grid">

        {/* Total Billed */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL BILLING</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-primary)' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(totalBilling)}</h2>
            <p style={{ color: 'var(--status-paid-text)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <TrendingUp size={14} /> Total generated billing
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>COLLECTED AMNT</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-paid-text)' }}>
              <Activity size={20} />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(totalCollected)}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
              {((totalCollected / (totalBilling || 1)) * 100).toFixed(0)}% overall clearance rate
            </p>
          </div>
        </div>

        {/* Total Pending */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>OUTSTANDING</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-pending-text)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(totalPending)}</h2>
            <p style={{ color: 'var(--status-pending-text)', fontSize: '0.75rem', marginTop: '4px' }}>
              Awaiting insurance/patient settlement
            </p>
          </div>
        </div>

        {/* Total Overdue */}
        <div className="glass-panel glass-panel-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>OVERDUE ACCTS</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-overdue-text)' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatCurrency(totalOverdue)}</h2>
            <p style={{ color: 'var(--status-overdue-text)', fontSize: '0.75rem', marginTop: '4px' }}>
              Action required: Past due date
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Charts & Recent Invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', flexWrap: 'wrap' }} className="dashboard-grid">

        {/* Chart Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Revenue Breakdown by Category</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Billing contribution across hospital departments.</p>
          </div>

          <div className="chart-container">
            <div className="bar-chart">
              {Object.entries(categoryTotals).map(([cat, val]) => {
                const heightPercentage = Math.max((val / maxCategoryValue) * 85, 4); // Min 4% height so it's visible
                const isSpecial = cat.includes('Surgery') || cat.includes('Room');
                return (
                  <div key={cat} className="bar-col">
                    <div
                      className={`bar-pill ${isSpecial ? 'bar-pill-purple' : ''}`}
                      style={{ height: `${heightPercentage}%` }}
                      data-val={formatCurrency(val)}
                    />
                    <span className="bar-label" style={{ fontSize: '0.7rem', textAlign: 'center', maxWidth: '70px', height: '36px', overflow: 'hidden' }}>
                      {cat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Invoices Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Recent Invoices</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Latest generated billing records.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('invoices')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentInvoices.map((inv) => {
              const totalAmount = inv.subtotal - inv.discount + inv.tax;
              return (
                <div
                  key={inv.id}
                  className="glass-panel-interactive"
                  onClick={() => onSelectInvoice(inv.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inv.patientName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      #{inv.invoiceNumber} • {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatCurrency(totalAmount)}</span>
                    <span className={`badge badge-${inv.status}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Monthly Performance Report & Collection Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', flexWrap: 'wrap' }} className="dashboard-grid">

        {/* Collection Breakdown by Payment Method */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Collection by Payment Method</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Amount collected or claimed by different payment modes.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Cash Payments */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)', background: 'rgba(16, 185, 129, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>💵</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cash Payments</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct clinical collection</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#10b981' }}>
                {formatCurrency(cashTotal)}
              </div>
            </div>

            {/* GPay Payments */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)', background: 'rgba(6, 182, 212, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>📱</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>GPay (UPI)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Digital/Mobile settlements</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#06b6d4' }}>
                {formatCurrency(gpayTotal)}
              </div>
            </div>



            {/* Pending Settlements */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.15)', background: 'rgba(245, 158, 11, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>⏳</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Pending Settlement</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting ledger payment</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--status-pending-text)' }}>
                {formatCurrency(pendingTotal)}
              </div>
            </div>

          </div>
        </div>

        {/* Performance Reports Table */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>{reportPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Performance Reports</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Summary of bills generated, clearance rates, and outstanding balances.</p>
            </div>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as 'monthly' | 'yearly')}
              className="form-control"
              style={{
                width: 'auto',
                padding: '6px 12px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                height: '34px',
                cursor: 'pointer'
              }}
            >
              <option value="monthly">Monthly View</option>
              <option value="yearly">Yearly View</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{reportPeriod === 'monthly' ? 'Month' : 'Year'}</th>
                  <th style={{ textAlign: 'right' }}>Total Billed</th>
                  <th style={{ textAlign: 'right' }}>Collected</th>
                  <th style={{ textAlign: 'right' }}>Outstanding</th>
                  <th style={{ textAlign: 'center' }}>Clearance</th>
                </tr>
              </thead>
              <tbody>
                {(reportPeriod === 'monthly' ? monthlyReports : yearlyReports).map((report) => (
                  <tr key={report.key}>
                    <td style={{ fontWeight: 600 }}>{report.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(report.billed)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--status-paid-text)' }}>{formatCurrency(report.collected)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500, color: report.outstanding > 0 ? 'var(--status-pending-text)' : 'var(--text-secondary)' }}>{formatCurrency(report.outstanding)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${report.clearanceRate >= 80 ? 'paid' : report.clearanceRate >= 50 ? 'pending' : 'overdue'}`}>
                        {report.clearanceRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Clinic Pharmacy Stock Alerts */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span style={{ color: 'var(--status-overdue-text)' }}>⚠️</span> Clinic Pharmacy Stock Alerts
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Critical medications running low or out of stock in clinic dispensary.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('services')} style={{ padding: '6px 12px' }}>
            Manage Inventory
          </button>
        </div>

        {lowStockMedicines.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {lowStockMedicines.map(med => {
              const isOut = med.stock === 0;
              return (
                <div 
                  key={med.id} 
                  style={{ 
                    padding: '14px 18px', 
                    borderRadius: '10px', 
                    border: isOut ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)', 
                    background: isOut ? 'rgba(239, 68, 68, 0.03)' : 'rgba(245, 158, 11, 0.03)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{med.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {med.code}</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    background: isOut ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                    color: isOut ? '#ef4444' : '#f59e0b' 
                  }}>
                    {isOut ? 'OUT OF STOCK' : `Only ${med.stock} left`}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#10b981', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px' }}>
            <span style={{ marginRight: '8px' }}>✓</span> All clinic medicines are adequately stocked.
          </div>
        )}
      </div>

    </div>
  );
};
