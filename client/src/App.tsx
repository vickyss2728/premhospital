import { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  PlusCircle, 
  Settings, 
  Heart,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import type { Invoice, Service } from './data/mockData';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceDetails } from './components/InvoiceDetails';
import { ServiceList } from './components/ServiceList';
import { Login } from './components/Login';
import { api } from './services/api';

/**
 * EXPLANATION: State Lifting & Conditional Rendering
 * 
 * 1. State Lifting:
 *    Since multiple screens (Dashboard, InvoiceList, InvoiceForm, ServiceList) need 
 *    to read or update the same list of invoices and services, we "lift" that state 
 *    up to their closest common ancestor: `App.tsx`.
 *    `App.tsx` holds the master states, and passes them down as Props, along with 
 *    updater callback functions (like `handleSaveInvoice`).
 * 
 * 2. Conditional Rendering:
 *    Instead of using a routing library, we use a simple `currentView` state.
 *    Inside the return block, we use standard JavaScript conditions (like `switch` or `&&`) 
 *    to render only the component corresponding to the active view.
 */

type ViewType = 'dashboard' | 'invoices' | 'new-invoice' | 'services' | 'invoice-details';

function App() {
  // Master states lifted to the parent App
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Color palette state persisted in localStorage
  const [palette, setPalette] = useState<'amethyst' | 'emerald'>(() => {
    return (localStorage.getItem('palette') as 'amethyst' | 'emerald') || 'amethyst';
  });

  // Apply palette class to document element
  useEffect(() => {
    if (palette === 'emerald') {
      document.documentElement.classList.add('theme-emerald');
      document.documentElement.classList.remove('theme-amethyst');
    } else {
      document.documentElement.classList.add('theme-amethyst');
      document.documentElement.classList.remove('theme-emerald');
    }
    localStorage.setItem('palette', palette);
  }, [palette]);
  
  // Mobile sidebar visibility state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication user role state
  const [currentUser, setCurrentUser] = useState<{ username: string; role: 'owner' | 'billing' } | null>(() => {
    const user = api.getCurrentUser();
    if (user) {
      return {
        username: user.role === 'owner' ? 'Dr. Thansekar (Owner)' : 'Billing Officer',
        role: user.role
      };
    }
    return null;
  });

  // Load invoices and services when authenticated
  useEffect(() => {
    if (currentUser) {
      api.getServices()
        .then(setServices)
        .catch(err => console.error('Failed to load services:', err));

      api.getInvoices()
        .then(setInvoices)
        .catch(err => console.error('Failed to load invoices:', err));
    }
  }, [currentUser]);

  // Derive the currently selected invoice for the details view
  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  // Navigation handlers
  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    setSidebarOpen(false); // Close mobile sidebar if open
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentView('invoice-details');
  };

  // State update handlers
  const handleSaveInvoice = async (savedInvoice: Invoice) => {
    try {
      if (selectedInvoiceId) {
        // Edit mode
        const created = await api.updateInvoice(savedInvoice.id, savedInvoice);
        setInvoices(invoices.map(inv => inv.id === savedInvoice.id ? created : inv));
      } else {
        // Create mode
        const created = await api.createInvoice(savedInvoice);
        setInvoices([created, ...invoices]);
      }

      // Re-fetch services to get latest stock levels
      const freshServices = await api.getServices();
      setServices(freshServices);
      
      setCurrentView('invoices');
    } catch (err: any) {
      alert(err.message || 'Failed to save invoice.');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'paid' | 'pending' | 'overdue') => {
    try {
      const invoiceToUpdate = invoices.find(inv => inv.id === id);
      if (!invoiceToUpdate) return;
      const totalVal = invoiceToUpdate.subtotal - invoiceToUpdate.discount + invoiceToUpdate.tax;
      const newAmtDue = status === 'paid' ? 0 : totalVal;

      const updated = await api.updateInvoiceStatus(id, status, newAmtDue);
      setInvoices(invoices.map(inv => inv.id === id ? updated : inv));
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
      if (selectedInvoiceId === id) {
        setSelectedInvoiceId(null);
      }
      
      // Re-fetch services to sync stock levels
      const freshServices = await api.getServices();
      setServices(freshServices);
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice.');
    }
  };

  const handleRequestDelete = async (id: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) return;
      
      const updated = await api.updateInvoice(id, { 
        ...invoice, 
        deleteRequestStatus: 'pending' 
      });
      
      setInvoices(invoices.map(inv => inv.id === id ? updated : inv));
      alert(`Deletion request submitted to the owner for invoice ${invoice.invoiceNumber}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit deletion request.');
    }
  };

  const handleApproveDelete = async (id: string, approve: boolean) => {
    try {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) return;
      
      const updated = await api.updateInvoice(id, { 
        ...invoice, 
        deleteRequestStatus: approve ? 'approved' : 'none' 
      });
      
      setInvoices(invoices.map(inv => inv.id === id ? updated : inv));
      alert(approve ? `Deletion request approved for invoice ${invoice.invoiceNumber}.` : `Deletion request rejected.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update deletion request.');
    }
  };

  const handleAddService = async (newService: Service) => {
    try {
      const created = await api.createService(newService);
      setServices([...services, created]);
    } catch (err: any) {
      alert(err.message || 'Failed to create service.');
    }
  };

  const handleUpdateService = async (updatedService: Service) => {
    try {
      const updated = await api.updateService(updatedService.id, updatedService);
      setServices(services.map(s => s.id === updatedService.id ? updated : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update service.');
    }
  };

  // Helper to render the active screen component
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            invoices={invoices} 
            services={services}
            onNavigate={handleNavigate}
            onSelectInvoice={handleSelectInvoice}
          />
        );
      case 'invoices':
        return (
          <InvoiceList 
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onUpdateStatus={handleUpdateStatus}
            onDeleteInvoice={handleDeleteInvoice}
            onRequestDelete={handleRequestDelete}
            onApproveDelete={handleApproveDelete}
            onNavigate={handleNavigate}
            userRole={currentUser?.role}
          />
        );
      case 'new-invoice':
        return (
          <InvoiceForm 
            services={services}
            onSave={handleSaveInvoice}
            onCancel={() => handleNavigate('invoices')}
            invoiceToEdit={activeInvoice || undefined}
          />
        );
      case 'invoice-details':
        return activeInvoice ? (
          <InvoiceDetails 
            invoice={activeInvoice}
            onBack={() => {
              setSelectedInvoiceId(null);
              handleNavigate('invoices');
            }}
            onEdit={() => handleNavigate('new-invoice')}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p>Invoice not found.</p>
            <button className="btn btn-primary" onClick={() => handleNavigate('invoices')}>
              Go to Records
            </button>
          </div>
        );
      case 'services':
        if (currentUser?.role !== 'owner') {
          return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h3 className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Restricted</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Only the hospital owner is authorized to view or modify standard service rates.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => handleNavigate('dashboard')}>
                Go to Dashboard
              </button>
            </div>
          );
        }
        return (
          <ServiceList 
            services={services}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
          />
        );
      default:
        return <div>View not implemented.</div>;
    }
  };

  if (!currentUser) {
    return (
      <Login 
        onLogin={setCurrentUser} 
        palette={palette}
        setPalette={setPalette}
      />
    );
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation Panel (Hidden on Print) */}
      <aside 
        className={`no-print sidebar ${sidebarOpen ? 'mobile-open' : ''}`}
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          zIndex: 100,
          transition: 'transform 0.3s ease'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--grad-primary)', color: '#040813' }}>
              <Heart size={20} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              Prem Hospital
            </span>
          </div>
          <button 
            className="btn btn-ghost no-print mobile-only" 
            onClick={() => setSidebarOpen(false)}
            style={{ padding: '4px', display: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <button 
            className={`btn btn-ghost ${currentView === 'dashboard' ? 'btn-primary' : ''}`}
            onClick={() => handleNavigate('dashboard')}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Home size={18} />
            Dashboard
          </button>

          <button 
            className={`btn btn-ghost ${currentView === 'invoices' || currentView === 'invoice-details' ? 'btn-primary' : ''}`}
            onClick={() => {
              setSelectedInvoiceId(null); // Clear selected invoice edit mode
              handleNavigate('invoices');
            }}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <FileText size={18} />
            Billing Records
          </button>

          <button 
            className={`btn btn-ghost ${currentView === 'new-invoice' && !selectedInvoiceId ? 'btn-primary' : ''}`}
            onClick={() => {
              setSelectedInvoiceId(null);
              handleNavigate('new-invoice');
            }}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <PlusCircle size={18} />
            Create Invoice
          </button>

          {currentUser?.role === 'owner' && (
            <button 
              className={`btn btn-ghost ${currentView === 'services' ? 'btn-primary' : ''}`}
              onClick={() => handleNavigate('services')}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Settings size={18} />
              Clinic Services
            </button>
          )}

        </nav>

        {/* Footer Credit & Logout */}
        <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Theme & Palette Controls Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>


            {/* Color Palette Switcher */}
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(255, 255, 255, 0.03)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setPalette('amethyst')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 2px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: palette === 'amethyst' ? 'var(--bg-card)' : 'transparent',
                  color: palette === 'amethyst' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }}></span> Amethyst
              </button>
              <button
                onClick={() => setPalette('emerald')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 2px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: palette === 'emerald' ? 'var(--bg-card)' : 'transparent',
                  color: palette === 'emerald' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> Emerald
              </button>
            </div>
          </div>

          <div>
            <p>User: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.username}</strong></p>
            <p style={{ marginTop: '2px', color: 'var(--accent-primary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {currentUser.role === 'owner' ? 'Hospital Owner' : 'Billing Section'}
            </p>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              api.logout();
              setCurrentUser(null);
              setCurrentView('dashboard');
            }}
            style={{ width: '100%', gap: '8px', padding: '6px', justifyContent: 'center' }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main 
        className="main-content"
        style={{
          padding: '40px',
          flexGrow: 1,
          maxHeight: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Mobile Navigation Header (Only visible on mobile viewports) */}
        <div 
          className="no-print mobile-header" 
          style={{ 
            display: 'none', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Prem Hospital</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
        </div>

        {/* Render active screen based on state */}
        {renderContent()}
      </main>

      {/* Embedded Mobile CSS Overrides */}
      <style>{`
        @media (max-width: 1024px) {
          .mobile-header {
            display: flex !important;
          }
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 250px;
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar .mobile-only {
            display: inline-flex !important;
          }
          .main-content {
            padding: 20px !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
        }
      `}</style>

    </div>
  );
}

export default App;
