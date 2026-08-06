import React, { useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import type { Invoice, Service, BillItem, PaymentMethod } from '../data/mockData';

/**
 * EXPLANATION: Complex State & Derived State
 * 1. Complex State:
 *    When managing arrays or objects in state (like `items`), we must never mutate the array directly.
 *    Instead, we create a new copy of the array (e.g. using `[...items]`) and set that as the new state.
 * 
 * 2. Derived State (Calculated Values):
 *    We do not need to store subtotal, tax, or amountDue in separate state variables.
 *    Instead, we calculate them directly during the component render phase. This guarantees 
 *    that the calculations are always in sync with patient details, discount inputs, and items.
 */

interface InvoiceFormProps {
  services: Service[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  invoiceToEdit?: Invoice; // Optional: if provided, we are editing
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  services,
  onSave,
  onCancel,
  invoiceToEdit
}) => {
  // Form fields states
  const [patientName, setPatientName] = useState(invoiceToEdit?.patientName || '');
  const [patientId, setPatientId] = useState(invoiceToEdit?.patientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [patientAge, setPatientAge] = useState(invoiceToEdit?.patientAge || 30);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(invoiceToEdit?.patientGender || 'Male');
  const [visitDate, setVisitDate] = useState(invoiceToEdit?.visitDate || new Date().toISOString().split('T')[0]);
  


  // Billing Items array state
  const [items, setItems] = useState<BillItem[]>(invoiceToEdit?.items || []);

  // Discount & Tax rates state
  const [discount, setDiscount] = useState(invoiceToEdit?.discount || 0);
  const [taxRate, setTaxRate] = useState(invoiceToEdit?.taxRate || 5); // Default 5% tax
  
  // Payment states
  const [status, setStatus] = useState<'paid' | 'pending' | 'overdue'>(invoiceToEdit?.status || 'pending');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(invoiceToEdit?.paymentMethod || 'Cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'success'>('idle');

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Web Audio Context not supported or blocked by browser permissions', e);
    }
  };

  const handleSimulatePayment = () => {
    if (!patientName.trim()) {
      alert('Patient name is required before completing payment');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one medical service to the invoice before payment');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStep('processing');
    
    // Simulate payment authorization
    setTimeout(() => {
      setPaymentStep('success');
      playSuccessChime();
      setStatus('paid');
      
      // Auto-submit the form after success animation delay
      setTimeout(() => {
        setIsProcessingPayment(false);
        setPaymentStep('idle');
        
        // Auto save invoice
        const savedInvoice: Invoice = {
          id: invoiceToEdit?.id || `inv-${Date.now()}`,
          invoiceNumber: invoiceToEdit?.invoiceNumber || `VC-2026-${Math.floor(1005 + Math.random() * 8000)}`,
          patientName,
          patientId,
          patientAge: Number(patientAge),
          patientGender,
          visitDate,
          insuranceProvider: 'None',
          insurancePolicyNumber: '',
          insuranceCoveragePct: 0,
          items,
          subtotal,
          discount: Number(discount),
          taxRate: Number(taxRate),
          tax,
          insuranceCoveredAmount: 0,
          amountDue: 0, // Since it is paid
          status: 'paid',
          paymentMethod: 'GPay',
          createdAt: invoiceToEdit?.createdAt || new Date().toISOString()
        };
        onSave(savedInvoice);
      }, 1500);
    }, 2000);
  };

  // State for the item constructor dropdowns
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Barcode Scanner states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sound generator using Web Audio API
  const playBeepSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Web Audio Context not supported or blocked by browser permissions', e);
    }
  };

  // Barcode scanner trigger
  const handleScanBarcode = (barcode: string) => {
    if (!barcode.trim()) return;
    
    const matchedService = services.find(s => s.barcode === barcode.trim());
    
    if (!matchedService) {
      playBeepSound();
      setScanMessage({ text: `Barcode [${barcode}] not registered in catalog!`, type: 'error' });
      setTimeout(() => setScanMessage(null), 3000);
      setBarcodeInput('');
      return;
    }
    
    if (matchedService.category === 'Pharmacy & Medicines' && matchedService.stock !== undefined) {
      const existingItem = items.find(item => item.serviceId === matchedService.id);
      const existingQty = existingItem ? existingItem.quantity : 0;
      
      if (matchedService.stock === 0) {
        setScanMessage({ text: `Out of Stock: ${matchedService.name} cannot be added!`, type: 'error' });
        setTimeout(() => setScanMessage(null), 3000);
        setBarcodeInput('');
        return;
      }
      
      if (existingQty + 1 > matchedService.stock) {
        setScanMessage({ text: `Failed: Only ${matchedService.stock} unit(s) in stock!`, type: 'error' });
        setTimeout(() => setScanMessage(null), 3000);
        setBarcodeInput('');
        return;
      }
    }
    
    playBeepSound();
    
    const existingItemIndex = items.findIndex(item => item.serviceId === matchedService.id);
    if (existingItemIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].amount = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      setItems(updatedItems);
    } else {
      const newItem: BillItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        serviceId: matchedService.id,
        name: matchedService.name,
        category: matchedService.category,
        price: matchedService.price,
        quantity: 1,
        amount: matchedService.price
      };
      setItems([...items, newItem]);
    }
    
    setScanMessage({ text: `Scanned: ${matchedService.name} added!`, type: 'success' });
    setTimeout(() => setScanMessage(null), 3000);
    setBarcodeInput('');
  };

  // Derive selected service object
  const currentSelectedService = services.find(s => s.id === selectedServiceId);

  // Calculations (Derived State)
  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const tax = Math.round((subtotal - discount) * (taxRate / 100) * 100) / 100;
  const totalInvoiceVal = Math.max(0, subtotal - discount + tax);
  
  // Patient outstanding liability
  const amountDue = totalInvoiceVal;

  // Add an item to the current invoice bill list
  const handleAddItem = () => {
    if (!currentSelectedService) return;

    // Stock check for medicines
    if (currentSelectedService.category === 'Pharmacy & Medicines' && currentSelectedService.stock !== undefined) {
      const existingItem = items.find(item => item.serviceId === currentSelectedService.id);
      const existingQty = existingItem ? existingItem.quantity : 0;
      const requestedTotalQty = existingQty + selectedQuantity;
      
      if (currentSelectedService.stock === 0) {
        alert(`Cannot add: ${currentSelectedService.name} is Out of Stock!`);
        return;
      }
      if (requestedTotalQty > currentSelectedService.stock) {
        alert(`Cannot add ${selectedQuantity} more units: Only ${currentSelectedService.stock - existingQty} unit(s) remaining in stock.`);
        return;
      }
    }

    // Check if service is already added, if so, increase quantity
    const existingItemIndex = items.findIndex(item => item.serviceId === currentSelectedService.id);
    
    if (existingItemIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += selectedQuantity;
      updatedItems[existingItemIndex].amount = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      setItems(updatedItems);
    } else {
      // Add as new item
      const newItem: BillItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        serviceId: currentSelectedService.id,
        name: currentSelectedService.name,
        category: currentSelectedService.category,
        price: currentSelectedService.price,
        quantity: selectedQuantity,
        amount: currentSelectedService.price * selectedQuantity
      };
      setItems([...items, newItem]);
    }

    // Reset selector quantity
    setSelectedQuantity(1);
  };

  // Remove item from bill list
  const handleRemoveItem = (itemId: string) => {
    const filtered = items.filter(item => item.id !== itemId);
    setItems(filtered);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      alert('Patient name is required');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one medical service to the invoice');
      return;
    }

    const savedInvoice: Invoice = {
      id: invoiceToEdit?.id || `inv-${Date.now()}`,
      invoiceNumber: invoiceToEdit?.invoiceNumber || `VC-2026-${Math.floor(1005 + Math.random() * 8000)}`,
      patientName,
      patientId,
      patientAge: Number(patientAge),
      patientGender,
      visitDate,
      insuranceProvider: 'None',
      insurancePolicyNumber: '',
      insuranceCoveragePct: 0,
      items,
      subtotal,
      discount: Number(discount),
      taxRate: Number(taxRate),
      tax,
      insuranceCoveredAmount: 0,
      amountDue,
      status,
      paymentMethod,
      createdAt: invoiceToEdit?.createdAt || new Date().toISOString()
    };

    onSave(savedInvoice);
  };

  return (
    <form className="animate-fade-in" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }} className="gradient-text">
            {invoiceToEdit ? `Edit Invoice: ${invoiceToEdit.invoiceNumber}` : 'Create Invoice'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Compile medical charges, log insurance coverage coefficients, and issue ledger bills.</p>
        </div>
      </div>

      {/* Main Form Fields Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '24px', flexWrap: 'wrap' }} className="dashboard-grid">
        
        {/* Left Column: Patient & Insurance Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Patient Details Card */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <FileText size={18} /> Patient Identification
            </h3>
            
            <div className="form-group">
              <label className="form-label">Patient Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Sarah Connor"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Patient ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PT-1049"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="150"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-control"
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Visit Date</label>
              <input
                type="date"
                className="form-control"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
          </div>



          {/* Payment Details Card */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <FileText size={18} /> Payment & Settlements
            </h3>

            <div className="form-row">
              <div className="form-group" style={{ flexGrow: 1 }}>
                <label className="form-label">Payment Status</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any;
                    setStatus(newStatus);
                    if (newStatus === 'pending' || newStatus === 'overdue') {
                      setPaymentMethod('Pending');
                    } else if (newStatus === 'paid' && paymentMethod === 'Pending') {
                      setPaymentMethod('Cash');
                    }
                  }}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="form-group" style={{ flexGrow: 1 }}>
                <label className="form-label">Payment Method</label>
                 <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="GPay">📱 GPay</option>
                  <option value="Pending">⏳ Pending</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'GPay' && (
              <div 
                className="animate-fade-in"
                style={{ 
                  marginTop: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.04)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontWeight: 600, fontSize: '0.85rem' }}>
                  <span>📱</span> GPay / UPI Instant Settlement
                </div>
                
                {isProcessingPayment ? (
                  <div style={{
                    height: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {paymentStep === 'processing' ? (
                      <>
                        <div className="payment-spinner" style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid rgba(6, 182, 212, 0.1)',
                          borderTop: '3px solid #06b6d4',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Verifying GPay UPI Scan...
                        </span>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                          Payment Successful!
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Finalizing clinical invoice...
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      padding: '10px', 
                      background: '#ffffff', 
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          `upi://pay?pa=drthansekar@okaxis&pn=Dr%20Thansekar&am=${amountDue}&cu=INR&tn=Prem%20Hospital`
                        )}`}
                        alt="GPay UPI QR Code"
                        style={{ width: '150px', height: '150px', display: 'block' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{amountDue}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        UPI ID: <strong>drthansekar@okaxis</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSimulatePayment}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        background: '#06b6d4',
                        color: '#070b19',
                        fontWeight: 700,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      ⚡ Simulate Payment Complete
                    </button>
                  </>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Billing Items Constructor & Current Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Services Selector Card */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                {scannerOpen ? 'Barcode Prescription Scanner' : 'Add Services & Treatments'}
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setScannerOpen(!scannerOpen)}
                style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'transparent', border: 'none' }}
              >
                {scannerOpen ? '📊 Standard Dropdown' : '📷 Barcode Scan (Prescription)'}
              </button>
            </div>

            {scannerOpen ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-in">
                {/* Scanner Interface Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px', alignItems: 'start' }} className="dashboard-grid">
                  
                  {/* Left Column: Visual Mock Viewport */}
                  <div style={{ 
                    position: 'relative', 
                    height: '210px', 
                    borderRadius: '8px', 
                    background: '#070b19', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)'
                  }}>
                    {/* Laser Sweeper Line */}
                    <div style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '3px',
                      background: '#ef4444',
                      boxShadow: '0 0 12px #ef4444, 0 0 6px #ef4444',
                      animation: 'sweep 2.5s infinite linear',
                      zIndex: 2
                    }} />

                    {/* Scanner Target Guide Corners */}
                    <div style={{ position: 'absolute', top: '15px', left: '15px', width: '16px', height: '16px', borderTop: '3px solid #ef4444', borderLeft: '3px solid #ef4444' }} />
                    <div style={{ position: 'absolute', top: '15px', right: '15px', width: '16px', height: '16px', borderTop: '3px solid #ef4444', borderRight: '3px solid #ef4444' }} />
                    <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '16px', height: '16px', borderBottom: '3px solid #ef4444', borderLeft: '3px solid #ef4444' }} />
                    <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '16px', height: '16px', borderBottom: '3px solid #ef4444', borderRight: '3px solid #ef4444' }} />

                    {/* Camera simulation watermark */}
                    <span style={{ fontSize: '0.65rem', color: '#ef4444', opacity: 0.8, position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', letterSpacing: '2px', fontWeight: 800 }}>
                      🔴 CAMERA ACTIVE
                    </span>

                    {/* Center scan icon */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ fontSize: '2.5rem' }}>📷</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>Align drug barcode in frame</span>
                    </div>

                    {/* Status/Toast alert inside viewport */}
                    {scanMessage && (
                      <div style={{
                        position: 'absolute',
                        bottom: '15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: scanMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        animation: 'bounce-in 0.2s ease',
                        width: '85%',
                        zIndex: 3
                      }}>
                        {scanMessage.text}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Manual Barcode Gun Input & Sim Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manual Barcode / Scan Gun Input</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Pistol Scan/Type EAN..."
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleScanBarcode(barcodeInput);
                            }
                          }}
                          style={{ fontSize: '0.8rem', padding: '6px 10px', height: '36px' }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => handleScanBarcode(barcodeInput)}
                          style={{ fontSize: '0.8rem', padding: '0 12px', height: '36px' }}
                        >
                          Submit
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <label className="form-label" style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Simulate Prescribed Medicine Scan:</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {services.filter(s => s.category === 'Pharmacy & Medicines' && s.barcode).map(s => {
                          const isLow = s.stock !== undefined && s.stock > 0 && s.stock < 10;
                          const isOut = s.stock !== undefined && s.stock === 0;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleScanBarcode(s.barcode!)}
                              disabled={isOut}
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '6px 10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: isOut ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>💊 {s.name.split(' (')[0]}</span>
                              <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: isOut ? 'rgba(239, 68, 68, 0.15)' : isLow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981' }}>
                                {isOut ? 'Out of Stock' : `Stock: ${s.stock}`}
                              </span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleScanBarcode('8909999999999')}
                          style={{ 
                            fontSize: '0.7rem', 
                            padding: '6px 10px',
                            border: '1px dotted var(--status-overdue-border)',
                            color: 'var(--status-overdue-text)',
                            background: 'rgba(220, 38, 38, 0.03)',
                            justifyContent: 'center'
                          }}
                        >
                          ⚠️ Scan Unregistered Drug Barcode
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                
                {/* Service Catalog Select */}
                <div className="form-group" style={{ flexGrow: 1, minWidth: '220px', marginBottom: 0 }}>
                  <label className="form-label">Service / Treatment</label>
                  <select
                    className="form-control"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    style={{ width: '100%', height: '42px' }}
                  >
                    {services.map(s => {
                      const isOutOfStock = s.category === 'Pharmacy & Medicines' && s.stock !== undefined && s.stock === 0;
                      const stockText = s.category === 'Pharmacy & Medicines' && s.stock !== undefined
                        ? ` (Stock: ${s.stock === 0 ? 'OUT OF STOCK' : s.stock})`
                        : '';
                      return (
                        <option key={s.id} value={s.id} disabled={isOutOfStock}>
                          {s.name} ({s.code}) - ₹{s.price}{stockText}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Quantity Select */}
                <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                  <label className="form-label">Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="100"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Math.max(1, Number(e.target.value)))}
                    style={{ height: '42px' }}
                  />
                </div>

                {/* Add Button */}
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddItem}
                  style={{ height: '42px', padding: '0 16px' }}
                >
                  <Plus size={18} /> Add
                </button>
              </div>
            )}
          </div>

          {/* Current Billed List Card */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '300px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Invoice Items ({items.length})
            </h3>
            
            {items.length > 0 ? (
              <div className="table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Rate</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                        <td>₹{item.price}</td>
                        <td>{item.quantity}</td>
                        <td style={{ fontWeight: 600 }}>₹{item.amount}</td>
                        <td>
                          <button 
                            type="button" 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => handleRemoveItem(item.id)}
                            style={{ padding: '4px', color: 'var(--status-overdue-text)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                <p>No billing items added yet.</p>
                <p style={{ fontSize: '0.8rem' }}>Choose services from the catalog above to populate the ledger invoice.</p>
              </div>
            )}

            {/* Financial Totals Calculations panel */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>

              {/* Discount flat input & Tax input row */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', margin: '8px 0' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '70px' }}>Discount:</span>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '70px' }}>Tax Rate (%):</span>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }}
                  />
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Calculated Tax ({taxRate}%):</span>
                <span>₹{tax}</span>
              </div>



              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px dotted var(--border-color)', paddingTop: '10px', marginTop: '6px' }}>
                <span>Amount Due:</span>
                <span className="gradient-text">₹{amountDue}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Form Submission Actions Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {invoiceToEdit ? 'Save Changes' : 'Generate Invoice'}
        </button>
      </div>

    </form>
  );
};
