import { Schema, model } from 'mongoose';

const invoiceItemSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const invoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientId: {
    type: String,
    required: true,
    trim: true
  },
  patientAge: {
    type: Number,
    required: true,
    min: 0
  },
  patientGender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  visitDate: {
    type: String,
    required: true
  },
  insuranceProvider: {
    type: String,
    default: 'None'
  },
  insurancePolicyNumber: {
    type: String,
    default: ''
  },
  insuranceCoveragePct: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 5,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  insuranceCoveredAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  amountDue: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'GPay', 'Pending'],
    default: 'Pending'
  },
  deleteRequestStatus: {
    type: String,
    enum: ['none', 'pending', 'approved'],
    default: 'none'
  }
}, {
  timestamps: true
});

export const Invoice = model('Invoice', invoiceSchema);
export default Invoice;
