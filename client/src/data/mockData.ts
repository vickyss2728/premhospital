/**
 * TYPES AND DATA STRUCTURES FOR VILLAGE CLINIC BILLING
 */

export type ServiceCategory = 
  | 'Consultation & Visits' 
  | 'Clinical Procedures' 
  | 'Diagnostics & Labs' 
  | 'Pharmacy & Medicines' 
  | 'General Charges';

export interface Service {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  price: number; // Base rate in ₹ (Rupees)
  barcode?: string;
  stock?: number;
}

export interface InvoiceItem {
  id: string;
  serviceId: string;
  name: string;
  category: ServiceCategory;
  price: number;
  quantity: number;
  amount: number; // Calculated as price * quantity
}

export type BillItem = InvoiceItem;
export type PaymentMethod = 'Cash' | 'GPay' | 'Pending';


export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientId: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  visitDate: string; // ISO date format YYYY-MM-DD
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePct?: number; // 0 to 100
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxRate: number; // e.g. 0.05 for 5%
  tax: number;
  insuranceCoveredAmount: number;
  amountDue: number; // (subtotal - discount + tax) - coveredAmount
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod: 'Cash' | 'GPay' | 'Pending';
  createdAt: string;
  deleteRequestStatus?: 'none' | 'pending' | 'approved';
}

// Affordable Village Clinic Rate Card (in ₹ Rupees)
export const INITIAL_SERVICES: Service[] = [
  { id: 'srv-1', name: 'General OPD Consultation', code: 'OPD-101', category: 'Consultation & Visits', price: 100 },
  { id: 'srv-2', name: 'Emergency Night Visit / Consultation', code: 'EMR-102', category: 'Consultation & Visits', price: 250 },
  { id: 'srv-3', name: 'Mobile Health Camp Checkup', code: 'CMP-103', category: 'Consultation & Visits', price: 30 },
  { id: 'srv-4', name: 'Blood Glucose (Diabetes) Check', code: 'TST-201', category: 'Diagnostics & Labs', price: 50 },
  { id: 'srv-5', name: 'Malaria Rapid Diagnostic Test (RDT)', code: 'TST-202', category: 'Diagnostics & Labs', price: 80 },
  { id: 'srv-6', name: 'Dengue NS1 Antigen Test', code: 'TST-203', category: 'Diagnostics & Labs', price: 200 },
  { id: 'srv-7', name: 'Basic Urine Culture & Analysis', code: 'TST-204', category: 'Diagnostics & Labs', price: 60 },
  { id: 'srv-8', name: 'Minor Wound Dressing & Bandaging', code: 'NRS-301', category: 'Clinical Procedures', price: 70 },
  { id: 'srv-9', name: 'Suturing / Stitching Minor Wounds', code: 'NRS-302', category: 'Clinical Procedures', price: 150 },
  { id: 'srv-10', name: 'IV Saline Drip Dehydration Support', code: 'NRS-303', category: 'Clinical Procedures', price: 120 },
  { id: 'srv-11', name: 'Generic Antibiotics (Full Course)', code: 'RX-401', category: 'Pharmacy & Medicines', price: 60, barcode: '8901111111111', stock: 12 },
  { id: 'srv-12', name: 'Basic Painkillers / Paracetamol (Strip)', code: 'RX-402', category: 'Pharmacy & Medicines', price: 15, barcode: '8902222222222', stock: 240 },
  { id: 'srv-13', name: 'Cough Syrup / Antihistamine Bottle', code: 'RX-403', category: 'Pharmacy & Medicines', price: 40, barcode: '8903333333333', stock: 8 },
  { id: 'srv-14', name: 'Antenatal Checkup (Pregnancy Care)', code: 'MAT-501', category: 'Clinical Procedures', price: 120 },
  { id: 'srv-15', name: 'Basic Delivery / Birthing Assistance', code: 'MAT-502', category: 'Clinical Procedures', price: 1500 },
  { id: 'srv-16', name: 'Baby Immunization & Growth Tracking', code: 'VMC-601', category: 'Clinical Procedures', price: 50 },
  { id: 'srv-17', name: 'Tetanus Toxoid Injection (TT)', code: 'VMC-602', category: 'Clinical Procedures', price: 40 }
];

// Pre-populated local patient logs
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'VC-2026-001',
    patientName: 'Ramesh Kumar',
    patientId: 'PT-3211',
    patientAge: 45,
    patientGender: 'Male',
    visitDate: '2026-07-28',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0, // 100% government scheme coverage
    items: [
      { id: 'item-1', serviceId: 'srv-1', name: 'General OPD Consultation', category: 'Consultation & Visits', price: 100, quantity: 1, amount: 100 },
      { id: 'item-2', serviceId: 'srv-5', name: 'Malaria Rapid Diagnostic Test (RDT)', category: 'Diagnostics & Labs', price: 80, quantity: 1, amount: 80 },
      { id: 'item-3', serviceId: 'srv-11', name: 'Generic Antibiotics (Full Course)', category: 'Pharmacy & Medicines', price: 60, quantity: 1, amount: 60 }
    ],
    subtotal: 240,
    discount: 0,
    taxRate: 0, // No tax for rural clinical welfare
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 240,
    status: 'paid',
    paymentMethod: 'Cash',
    createdAt: '2026-07-28T09:30:00Z'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'VC-2026-002',
    patientName: 'Sita Devi',
    patientId: 'PT-8849',
    patientAge: 29,
    patientGender: 'Female',
    visitDate: '2026-07-27',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0, // Government Health Insurance scheme
    items: [
      { id: 'item-4', serviceId: 'srv-14', name: 'Antenatal Checkup (Pregnancy Care)', category: 'Clinical Procedures', price: 120, quantity: 1, amount: 120 },
      { id: 'item-5', serviceId: 'srv-4', name: 'Blood Glucose (Diabetes) Check', category: 'Diagnostics & Labs', price: 50, quantity: 1, amount: 50 },
      { id: 'item-6', serviceId: 'srv-12', name: 'Basic Painkillers / Paracetamol (Strip)', category: 'Pharmacy & Medicines', price: 15, quantity: 2, amount: 30 }
    ],
    subtotal: 200,
    discount: 0,
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 0,
    status: 'paid',
    paymentMethod: 'GPay',
    createdAt: '2026-07-27T11:15:00Z'
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'VC-2026-003',
    patientName: 'Chinnasamy',
    patientId: 'PT-1102',
    patientAge: 72,
    patientGender: 'Male',
    visitDate: '2026-07-25',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0,
    items: [
      { id: 'item-7', serviceId: 'srv-2', name: 'Emergency Night Visit / Consultation', category: 'Consultation & Visits', price: 250, quantity: 1, amount: 250 },
      { id: 'item-8', serviceId: 'srv-10', name: 'IV Saline Drip Dehydration Support', category: 'Clinical Procedures', price: 120, quantity: 2, amount: 240 },
      { id: 'item-9', serviceId: 'srv-11', name: 'Generic Antibiotics (Full Course)', category: 'Pharmacy & Medicines', price: 60, quantity: 2, amount: 120 }
    ],
    subtotal: 610,
    discount: 100, // Community elder discount
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 510,
    status: 'pending', // Awaiting family cash settlement
    paymentMethod: 'Pending',
    createdAt: '2026-07-26T08:00:00Z'
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'VC-2026-004',
    patientName: 'Aarav Patel',
    patientId: 'PT-5420',
    patientAge: 5,
    patientGender: 'Male',
    visitDate: '2026-07-29',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0, // Fully funded wellness vaccine
    items: [
      { id: 'item-10', serviceId: 'srv-16', name: 'Baby Immunization & Growth Tracking', category: 'Clinical Procedures', price: 50, quantity: 1, amount: 50 },
      { id: 'item-11', serviceId: 'srv-17', name: 'Tetanus Toxoid Injection (TT)', category: 'Clinical Procedures', price: 40, quantity: 1, amount: 40 }
    ],
    subtotal: 90,
    discount: 0,
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 90,
    status: 'paid',
    paymentMethod: 'GPay',
    createdAt: '2026-07-29T10:45:00Z'
  },
  {
    id: 'inv-1005',
    invoiceNumber: 'VC-2026-005',
    patientName: 'Muthu Karuppan',
    patientId: 'PT-2291',
    patientAge: 50,
    patientGender: 'Male',
    visitDate: '2026-06-15',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0,
    items: [
      { id: 'item-12', serviceId: 'srv-1', name: 'General OPD Consultation', category: 'Consultation & Visits', price: 100, quantity: 1, amount: 100 },
      { id: 'item-13', serviceId: 'srv-9', name: 'Suturing / Stitching Minor Wounds', category: 'Clinical Procedures', price: 150, quantity: 2, amount: 300 }
    ],
    subtotal: 400,
    discount: 0,
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 0,
    status: 'paid',
    paymentMethod: 'Cash',
    createdAt: '2026-06-15T10:00:00Z'
  },
  {
    id: 'inv-1006',
    invoiceNumber: 'VC-2026-006',
    patientName: 'Anjali Devi',
    patientId: 'PT-3301',
    patientAge: 32,
    patientGender: 'Female',
    visitDate: '2026-06-28',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0,
    items: [
      { id: 'item-14', serviceId: 'srv-1', name: 'General OPD Consultation', category: 'Consultation & Visits', price: 100, quantity: 1, amount: 100 },
      { id: 'item-15', serviceId: 'srv-6', name: 'Dengue NS1 Antigen Test', category: 'Diagnostics & Labs', price: 200, quantity: 1, amount: 200 },
      { id: 'item-16', serviceId: 'srv-13', name: 'Cough Syrup / Antihistamine Bottle', category: 'Pharmacy & Medicines', price: 40, quantity: 1, amount: 40 }
    ],
    subtotal: 340,
    discount: 0,
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 0,
    status: 'paid',
    paymentMethod: 'GPay',
    createdAt: '2026-06-28T16:30:00Z'
  },
  {
    id: 'inv-1007',
    invoiceNumber: 'VC-2025-001',
    patientName: 'Velu Pillai',
    patientId: 'PT-1055',
    patientAge: 58,
    patientGender: 'Male',
    visitDate: '2025-11-20',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0,
    items: [
      { id: 'item-17', serviceId: 'srv-2', name: 'Emergency Night Visit / Consultation', category: 'Consultation & Visits', price: 250, quantity: 1, amount: 250 },
      { id: 'item-18', serviceId: 'srv-9', name: 'Suturing / Stitching Minor Wounds', category: 'Clinical Procedures', price: 150, quantity: 1, amount: 150 }
    ],
    subtotal: 400,
    discount: 50,
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 350,
    status: 'paid',
    paymentMethod: 'Cash',
    createdAt: '2025-11-20T20:15:00Z'
  },
  {
    id: 'inv-1008',
    invoiceNumber: 'VC-2025-002',
    patientName: 'Mina Selvam',
    patientId: 'PT-9902',
    patientAge: 35,
    patientGender: 'Female',
    visitDate: '2025-05-10',
    insuranceProvider: 'None',
    insurancePolicyNumber: '',
    insuranceCoveragePct: 0,
    items: [
      { id: 'item-19', serviceId: 'srv-15', name: 'Basic Delivery / Birthing Assistance', category: 'Clinical Procedures', price: 1500, quantity: 1, amount: 1500 }
    ],
    subtotal: 1500,
    discount: 0,
    taxRate: 0,
    tax: 0,
    insuranceCoveredAmount: 0,
    amountDue: 1500,
    status: 'paid',
    paymentMethod: 'GPay',
    createdAt: '2025-05-10T14:00:00Z'
  }
];
