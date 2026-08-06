import React, { useState } from 'react';
import { Search, Edit2, AlertCircle } from 'lucide-react';
import type { Service, ServiceCategory } from '../data/mockData';

/**
 * EXPLANATION: Controlled Form Inputs in React
 * In React, form inputs are usually "controlled." This means that the input value 
 * is bound to a React state variable, and updating the input triggers an `onChange` 
 * event that updates the state.
 * 
 * Example:
 *   <input value={name} onChange={(e) => setName(e.target.value)} />
 * 
 * This ensures that the state is the "single source of truth" for the form values.
 */

interface ServiceListProps {
  services: Service[];
  onAddService: (service: Service) => void;
  onUpdateService: (service: Service) => void;
}

const CATEGORIES: ServiceCategory[] = [
  'Consultation & Visits',
  'Clinical Procedures',
  'Diagnostics & Labs',
  'Pharmacy & Medicines',
  'General Charges'
];

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  onAddService,
  onUpdateService
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form states for creating / editing a service
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('Consultation & Visits');
  const [formPrice, setFormPrice] = useState(0);
  const [formBarcode, setFormBarcode] = useState('');
  const [formStock, setFormStock] = useState<number | undefined>(undefined);

  // Filter services list
  const filteredServices = services.filter(srv => {
    const matchesSearch = 
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.code.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || srv.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handle Edit Action trigger
  const handleEditClick = (srv: Service) => {
    setEditingServiceId(srv.id);
    setFormName(srv.name);
    setFormCode(srv.code);
    setFormCategory(srv.category);
    setFormPrice(srv.price);
    setFormBarcode(srv.barcode || '');
    setFormStock(srv.stock);
  };

  // Reset service form fields
  const handleResetForm = () => {
    setEditingServiceId(null);
    setFormName('');
    setFormCode('');
    setFormCategory('Consultation & Visits');
    setFormPrice(0);
    setFormBarcode('');
    setFormStock(undefined);
  };

  // Form submit handler (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formCode.trim() || formPrice <= 0) {
      alert('Please fill out all fields with valid rates');
      return;
    }

    if (editingServiceId) {
      // Editing Mode
      const updated: Service = {
        id: editingServiceId,
        name: formName,
        code: formCode,
        category: formCategory,
        price: Number(formPrice),
        barcode: formCategory === 'Pharmacy & Medicines' ? formBarcode.trim() || undefined : undefined,
        stock: formCategory === 'Pharmacy & Medicines' ? (formStock !== undefined ? Number(formStock) : 0) : undefined
      };
      onUpdateService(updated);
    } else {
      // Adding Mode
      // Check if code already exists
      if (services.some(s => s.code.toLowerCase() === formCode.toLowerCase())) {
        alert(`Service code "${formCode}" already exists.`);
        return;
      }

      const newItem: Service = {
        id: `srv-${Date.now()}`,
        name: formName,
        code: formCode,
        category: formCategory,
        price: Number(formPrice),
        barcode: formCategory === 'Pharmacy & Medicines' ? formBarcode.trim() || undefined : undefined,
        stock: formCategory === 'Pharmacy & Medicines' ? (formStock !== undefined ? Number(formStock) : 0) : undefined
      };
      onAddService(newItem);
    }

    handleResetForm();
  };

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
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }} className="gradient-text">Medical Services Rate Card</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Catalog billing codes, update standard service fees, and append newly approved hospital procedures.</p>
      </div>

      {/* Grid: Rate Card Catalog list & Form Constructor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', flexWrap: 'wrap' }} className="dashboard-grid">
        
        {/* Left Column: Services list catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Search/Filters */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search service name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ width: '160px' }}>
              <select
                className="form-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ maxHeight: '460px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Service Name</th>
                    <th>Barcode</th>
                    <th>Stock Level</th>
                    <th style={{ textAlign: 'right' }}>Standard Price</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((srv) => (
                    <tr key={srv.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {srv.code}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{srv.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{srv.category}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {srv.barcode || '-'}
                      </td>
                      <td>
                        {srv.category === 'Pharmacy & Medicines' ? (
                          srv.stock === undefined || srv.stock === 0 ? (
                            <span className="badge badge-overdue" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Out of Stock</span>
                          ) : srv.stock < 10 ? (
                            <span className="badge badge-pending" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Low Stock ({srv.stock})</span>
                          ) : (
                            <span className="badge badge-paid" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>In Stock ({srv.stock})</span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(srv.price)}</td>
                      <td>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleEditClick(srv)}
                          title="Edit Service Rate"
                          style={{ padding: '4px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Add / Edit Form */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
            
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {editingServiceId ? 'Edit Medical Service' : 'Add Medical Service'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {editingServiceId ? 'Modify base rates or parameters of the selected service.' : 'Append a new treatment category to the hospital billing catalog.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Electrocardiogram (ECG)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Code *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ECG-502"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  disabled={editingServiceId !== null} // Lock code editing to preserve relationships
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical Category</label>
                <select
                  className="form-control"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ServiceCategory)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Standard Price (INR) *</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="100000"
                  placeholder="0.00"
                  value={formPrice || ''}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  required
                />
              </div>

              {formCategory === 'Pharmacy & Medicines' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flexGrow: 2 }}>
                    <label className="form-label">Barcode / UPC</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 8901111111111"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flexGrow: 1, width: '100px' }}>
                    <label className="form-label">Initial Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      placeholder="0"
                      value={formStock !== undefined ? formStock : ''}
                      onChange={(e) => setFormStock(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {editingServiceId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleResetForm}
                    style={{ flexGrow: 1 }}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 2 }}>
                  {editingServiceId ? 'Update Service' : 'Register Service'}
                </button>
              </div>

            </form>

            <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.1)', borderRadius: '8px', marginTop: '8px' }}>
              <AlertCircle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Registering new services updates the list for future invoice creation. Changing existing rates will not affect generated/historical invoices to maintain auditing records.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
