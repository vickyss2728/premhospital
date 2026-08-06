import React, { useState } from 'react';
import { ArrowLeft, Printer, Edit3, Heart } from 'lucide-react';
import type { Invoice } from '../data/mockData';

/**
 * EXPLANATION: UI Separation and Print Layout Integration
 * 
 * In standard web applications, interfaces are rich, colored, and animated.
 * However, physical printing requires a completely different format (usually
 * black-on-white high contrast, clean margins, hiding menus and buttons).
 * 
 * In `src/index.css`, we defined a `@media print` stylesheet that overrides the
 * styles below. When the user clicks the "Print" button which triggers `window.print()`,
 * the browser will automatically hide navigation sidebars and headers, and render a
 * clean white clinical ledger.
 */

interface InvoiceDetailsProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: () => void;
  onUpdateStatus?: (id: string, status: 'paid' | 'pending' | 'overdue') => void;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  onBack,
  onEdit,
  onUpdateStatus
}) => {
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
    setIsProcessingPayment(true);
    setPaymentStep('processing');
    
    // Simulate payment authorization
    setTimeout(() => {
      setPaymentStep('success');
      playSuccessChime();
      
      // Auto-update status to paid after a short delay
      setTimeout(() => {
        if (onUpdateStatus) {
          onUpdateStatus(invoice.id, 'paid');
        }
        setIsProcessingPayment(false);
        setPaymentStep('idle');
      }, 1500);
    }, 2000);
  };

  const totalAmount = invoice.subtotal - invoice.discount + invoice.tax;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Control Actions Panel (Hidden during Printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Records
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onEdit}>
            <Edit3 size={16} /> Edit Invoice
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Sheet */}
      <div className="glass-panel invoice-print-container" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Transparent Large Status Watermark (Hidden/Styled differently in print) */}
        <div 
          className="no-print"
          style={{ 
            position: 'absolute', 
            right: '40px', 
            top: '160px', 
            fontSize: '5rem', 
            fontWeight: 900, 
            opacity: 0.04, 
            textTransform: 'uppercase',
            transform: 'rotate(-12deg)',
            pointerEvents: 'none',
            color: invoice.status === 'paid' ? 'var(--status-paid-text)' : invoice.status === 'pending' ? 'var(--status-pending-text)' : 'var(--status-overdue-text)'
          }}
        >
          {invoice.status}
        </div>

        {/* Invoice Header */}
        <div className="invoice-print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          
          {/* Hospital Logo & Details */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--grad-primary)', color: '#040813' }}>
              <Heart size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-primary">Prem Hospital</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Vadipatti-625218, Madurai Dist, Tamil Nadu</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Doctors: Dr. Thansekar, MD | Dr. Umamaheswarai, MBBS</p>
            </div>
          </div>

          {/* Invoice ID / Date */}
          <div style={{ textAlign: 'right' }}>
            <span className={`badge badge-${invoice.status}`} style={{ marginBottom: '8px' }}>
              {invoice.status}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
              Invoice: {invoice.invoiceNumber}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Issued: {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Visit Date: {invoice.visitDate ? new Date(invoice.visitDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>

        </div>

        {/* Patient & Insurance Breakdown */}
        <div className="invoice-print-details dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Patient Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Billed Patient:
            </h4>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{invoice.patientName}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Patient Reference ID: <strong>{invoice.patientId}</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Age / Gender: {invoice.patientAge} years / {invoice.patientGender}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Payment Method: <strong style={{ 
                color: invoice.paymentMethod === 'Cash' ? '#10b981' : 
                       invoice.paymentMethod === 'GPay' ? '#06b6d4' : 'var(--text-muted)'
              }}>
                {invoice.paymentMethod === 'Cash' && '💵 Cash'}
                {invoice.paymentMethod === 'GPay' && '📱 GPay'}
                {invoice.paymentMethod === 'Pending' && '⏳ Pending Settlement'}
              </strong>
            </div>
          </div>

          {/* Insurance & Subsidy Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subsidies & Insurance:
            </h4>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {invoice.insuranceProvider && invoice.insuranceProvider !== 'None' 
                ? invoice.insuranceProvider 
                : 'No Subsidy / Cash Account'}
            </div>
            {invoice.insuranceProvider && invoice.insuranceProvider !== 'None' ? (
              <>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Policy/Scheme No: <strong>{invoice.insurancePolicyNumber || 'N/A'}</strong>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Coverage Ratio: <strong>{invoice.insuranceCoveragePct}%</strong>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#10b981', marginTop: '4px', fontWeight: 700 }}>
                  Subsidized Coverage: {formatCurrency(invoice.insuranceCoveredAmount)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                No government schema co-pay or private insurance applied to this clinical ledger.
              </div>
            )}
          </div>

        </div>

        {/* Billed Items Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Itemized Clinical Charges
          </h4>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Code</th>
                  <th>Description</th>
                  <th>Department Category</th>
                  <th style={{ textAlign: 'right' }}>Unit Rate</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {item.serviceId.substring(0, 7).toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary and Payment Layout Grid */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginTop: '24px', 
          flexWrap: 'wrap', 
          gap: '24px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          width: '100%'
        }}>
             {/* Left Side: GPay Payment QR Code & Interactive Simulator */}
          {invoice.paymentMethod === 'GPay' ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.03)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              textAlign: 'center',
              width: '200px',
              position: 'relative'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#06b6d4' }}>
                {invoice.status === 'paid' ? 'Paid via GPay / UPI' : 'Scan to Pay Balance'}
              </span>
              
              {isProcessingPayment ? (
                <div style={{
                  height: '110px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {paymentStep === 'processing' ? (
                    <>
                      <div className="payment-spinner" style={{
                        width: '28px',
                        height: '28px',
                        border: '3px solid rgba(6, 182, 212, 0.1)',
                        borderTop: '3px solid #06b6d4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Verifying UPI...
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                        Success!
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ padding: '8px', background: '#ffffff', borderRadius: '8px' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                      `upi://pay?pa=drthansekar@okaxis&pn=Dr%20Thansekar&am=${invoice.amountDue}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`
                    )}`}
                    alt="UPI QR Code"
                    style={{ width: '110px', height: '110px', display: 'block', filter: invoice.status === 'paid' ? 'grayscale(1) opacity(0.3)' : 'none' }}
                  />
                </div>
              )}

              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                UPI ID: <strong>drthansekar@okaxis</strong>
              </span>

              {invoice.status !== 'paid' && !isProcessingPayment && (
                <button
                  onClick={handleSimulatePayment}
                  className="btn btn-primary btn-sm no-print"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    marginTop: '6px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: '#06b6d4',
                    color: '#070b19',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  ⚡ Complete Payment
                </button>
              )}
            </div>
          ) : <div />}

          {/* Right Side: Totals Summary */}
          <div style={{ 
            width: '320px', 
            maxWidth: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px'
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal Charges:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>

            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--status-overdue-text)' }}>
                <span>Deductions / Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              <span>Sales & Medical Tax ({invoice.taxRate}%):</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span>Total Amount:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>



            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              borderTop: '2px solid var(--accent-primary)', 
              paddingTop: '12px',
              marginTop: '4px',
              color: 'var(--text-primary)'
            }}>
              <span>Amount Due:</span>
              <span className="gradient-text">{formatCurrency(invoice.amountDue)}</span>
            </div>

          </div>
        </div>

        {/* Footer Notes */}
        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <p>This is a computer-generated billing statement dispatched by the clinical systems at Prem Hospital.</p>
          <p>Please address all subsidy claims or ledger inquiries to the hospital manager.</p>
        </div>

      </div>

    </div>
  );
};
