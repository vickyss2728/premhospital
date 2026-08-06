import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Consultation & Visits', 'Clinical Procedures', 'Diagnostics & Labs', 'Pharmacy & Medicines', 'General Charges']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null/undefined barcodes but enforces uniqueness if present
  },
  stock: {
    type: Number,
    // Optional because non-pharmacy items (e.g. consultations) don't have stock limits
    required: false,
    min: 0
  }
}, {
  timestamps: true
});

export const Service = model('Service', serviceSchema);
export default Service;
