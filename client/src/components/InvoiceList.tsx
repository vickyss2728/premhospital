import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import type { Invoice } from '../data/mockData';

/**
 * EXPLANATION: React State & useState Hook
 * In React, we use "State" to represent data that can change over time based on user actions.
 * Unlike regular variables, when a state variable changes, React automatically "re-renders"
 * (updates) the visual interface to display the new data.
 * 
 * The `useState` hook returns two things:
 * 1. The current state value (e.g., `searchTerm`)
 * 2. A function to update that state value (e.g., `setSearchTerm`)
 */

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: 'paid' | 'pending' | 'overdue') => void;
  onDeleteInvoice: (id: string) => void;
  onRequestDelete?: (id: string) => void;
  onApproveDelete?: (id: string, approve: boolean) => void;
  onNavigate: (view: 'dashboard' | 'invoices' | 'new-invoice' | 'services') => void;
  userRole?: 'owner' | 'billing';
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onSelectInvoice,
  onUpdateStatus,
  onDeleteInvoice,
  onRequestDelete,
  onApproveDelete,
  onNavigate,
  userRole
}) => {
  // State for search input
  const [searchTerm, setSearchTerm] = useState('');
  // State for status filtering
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  // State for date range filtering
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  // State for sorting
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Filter invoices based on search term, status dropdown, and date-wise criteria
  const filteredInvoices = invoices
    .filter(inv => {
      const matchesSearch = 
        inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      
      // Normalize visit date (YYYY-MM-DD) to compare with input type=date
      const invDateStr = inv.visitDate ? inv.visitDate.split('T')[0] : '';
      const matchesStartDate = !startDateFilter || invDateStr >= startDateFilter;
      const matchesEndDate = !endDateFilter || invDateStr <= endDateFilter;
      
      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime();
      }
      const aTotal = a.subtotal - a.discount + a.tax;
      const bTotal = b.subtotal - b.discount + b.tax;
      if (sortBy === 'amount-desc') {
        return bTotal - aTotal;
      }
      if (sortBy === 'amount-asc') {
        return aTotal - bTotal;
      }
      return 0;
    });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }} className="gradient-text">Billing Records</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage patient invoice accounts, verify payment clearances, and dispatch reminders.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('new-invoice')}>
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Search, Filter, Sort and Date Range Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Top Controls: Search, Status Filter, Sort Order */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search patient name, ID, or invoice #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Sort By:</span>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="date-desc">Visit Date (Newest)</option>
              <option value="date-asc">Visit Date (Oldest)</option>
              <option value="amount-desc">Total Amount (High)</option>
              <option value="amount-asc">Total Amount (Low)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From Date:</span>
            <input
              type="date"
              className="form-control"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              style={{ width: '160px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To Date:</span>
            <input
              type="date"
              className="form-control"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              style={{ width: '160px', cursor: 'pointer' }}
            />
          </div>

          {(startDateFilter || endDateFilter) && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              style={{ padding: '6px 12px' }}
            >
              Clear Date Filters
            </button>
          )}
        </div>

      </div>

      {/* Pending Deletion Requests Alert for Owner */}
      {userRole === 'owner' && invoices.some(inv => inv.deleteRequestStatus === 'pending') && (
        <div className="glass-panel" style={{ border: '1px solid var(--status-overdue-border)', background: 'rgba(239, 68, 68, 0.04)', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
          <h4 style={{ color: 'var(--status-overdue-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
            ⚠️ Pending Invoice Deletion Requests ({invoices.filter(inv => inv.deleteRequestStatus === 'pending').length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {invoices.filter(inv => inv.deleteRequestStatus === 'pending').map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <strong>Invoice: {inv.invoiceNumber}</strong> ({inv.patientName}) - Total: ₹{inv.subtotal - inv.discount + inv.tax}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => onApproveDelete && onApproveDelete(inv.id, true)}
                    style={{ fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981', color: 'white', padding: '4px 10px' }}
                  >
                    ✓ Accept Deletion
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => onApproveDelete && onApproveDelete(inv.id, false)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Records Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {filteredInvoices.length > 0 ? (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Patient Detail</th>
                  <th>Visit Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Status Quick-Change</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const invoiceTotal = inv.subtotal - inv.discount + inv.tax;
                  return (
                    <tr key={inv.id}>
                      {/* Invoice ID */}
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {inv.invoiceNumber}
                      </td>
                      
                      {/* Patient Name and ID */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{inv.patientName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: {inv.patientId} • Age: {inv.patientAge} ({inv.patientGender})
                          </span>
                        </div>
                      </td>

                      {/* Visit Date */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {inv.visitDate ? new Date(inv.visitDate).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Total Amount */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700 }}>{formatCurrency(invoiceTotal)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Due: {formatCurrency(inv.amountDue)}
                          </span>
                        </div>
                      </td>

                      {/* Current Status Badge & Payment Method */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <span className={`badge badge-${inv.status}`}>
                            {inv.status === 'paid' && <CheckCircle2 size={12} style={{ marginRight: '3px' }} />}
                            {inv.status === 'pending' && <Clock size={12} style={{ marginRight: '3px' }} />}
                            {inv.status === 'overdue' && <AlertCircle size={12} style={{ marginRight: '3px' }} />}
                            {inv.status}
                          </span>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: inv.paymentMethod === 'Cash' ? '#10b981' : 
                                   inv.paymentMethod === 'GPay' ? '#06b6d4' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 500,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: inv.paymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.08)' :
                                        inv.paymentMethod === 'GPay' ? 'rgba(6, 182, 212, 0.08)' :
                                        'rgba(255,255,255,0.03)',
                            border: `1px solid ${
                              inv.paymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.2)' :
                              inv.paymentMethod === 'GPay' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.08)'
                            }`
                          }}>
                            {inv.paymentMethod === 'Cash' && '💵 Cash'}
                            {inv.paymentMethod === 'GPay' && '📱 GPay'}

                            {inv.paymentMethod === 'Pending' && '⏳ Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Quick Update Selector */}
                      <td>
                        <select
                          className="form-control"
                          value={inv.status}
                          onChange={(e) => onUpdateStatus(inv.id, e.target.value as any)}
                          style={{ 
                            fontSize: '0.8rem', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            width: '120px', 
                            cursor: 'pointer',
                            backgroundColor: 'rgba(255,255,255,0.03)'
                          }}
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>

                      {/* Actions Buttons */}
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => onSelectInvoice(inv.id)}
                            title="View Invoice Details"
                            style={{ padding: '6px' }}
                          >
                            <Eye size={16} />
                          </button>
                          {/* Owner Actions */}
                          {userRole === 'owner' && (
                            <>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.patientName}?`)) {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                title="Delete Invoice"
                                style={{ padding: '6px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              {inv.deleteRequestStatus === 'pending' && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => onApproveDelete && onApproveDelete(inv.id, true)}
                                    title="Approve Deletion Request"
                                    style={{ padding: '2px 6px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="btn btn-sm"
                                    onClick={() => onApproveDelete && onApproveDelete(inv.id, false)}
                                    title="Reject Deletion Request"
                                    style={{ padding: '2px 6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    ✗
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {/* Billing Officer Actions */}
                          {userRole === 'billing' && (
                            <>
                              {inv.deleteRequestStatus === 'approved' ? (
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete this approved invoice ${inv.invoiceNumber}?`)) {
                                      onDeleteInvoice(inv.id);
                                    }
                                  }}
                                  title="Delete Invoice (Approved)"
                                  style={{ padding: '6px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : inv.deleteRequestStatus === 'pending' ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--status-pending-text)', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)' }}>
                                  Requested
                                </span>
                              ) : (
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    if (confirm(`Submit deletion request to owner for invoice ${inv.invoiceNumber}?`)) {
                                      onRequestDelete && onRequestDelete(inv.id);
                                    }
                                  }}
                                  title="Request Deletion from Owner"
                                  style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--status-pending-text)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}
                                >
                                  Request Del
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No records found</p>
            <p style={{ fontSize: '0.85rem' }}>Try modifying your search queries or adding a new patient invoice profile.</p>
          </div>
        )}
      </div>

    </div>
  );
};
