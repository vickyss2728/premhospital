import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { notFound, errorHandler } from './middleware/errorMiddleware';

// Import Routers
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import invoiceRoutes from './routes/invoiceRoutes';

// Import Models for Seeding
import Service from './models/Service';
import User from './models/User';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏥 Hospital Billing & Pharmacy Management API online.',
    version: '1.0.0'
  });
});

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/invoices', invoiceRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Database Seeding Logic
const seedDatabase = async () => {
  try {
    // 1. Seed Clinical Services Catalog
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log('🌱 Seeding clinical services and pharmacy inventory catalog...');
      const initialServices = [
        { name: 'Generic Antibiotics (Full Course)', code: 'RX-401', category: 'Pharmacy & Medicines', price: 60, barcode: '8901111111111', stock: 12 },
        { name: 'Basic Painkillers / Paracetamol (Strip)', code: 'RX-402', category: 'Pharmacy & Medicines', price: 15, barcode: '8902222222222', stock: 240 },
        { name: 'Cough Syrup / Antihistamine Bottle', code: 'RX-403', category: 'Pharmacy & Medicines', price: 40, barcode: '8903333333333', stock: 8 },
        { name: 'General OPD Consultation', code: 'OP-101', category: 'Consultation & Visits', price: 100 },
        { name: 'Senior Consultant Visit', code: 'OP-102', category: 'Consultation & Visits', price: 250 },
        { name: 'Emergency Admission Charges', code: 'ER-201', category: 'General Charges', price: 500 },
        { name: 'Complete Blood Count (CBC) Panel', code: 'DX-301', category: 'Diagnostics & Labs', price: 180 },
        { name: 'Electrocardiogram (ECG) Diagnostic', code: 'DX-302', category: 'Diagnostics & Labs', price: 350 },
        { name: 'Ward Nursing Charges (Per 24h)', code: 'GEN-501', category: 'General Charges', price: 120 },
        { name: 'ICU Critical Monitoring (Per 24h)', code: 'GEN-502', category: 'General Charges', price: 800 },
        { name: 'Minor Clinical Dressing', code: 'PROC-601', category: 'Clinical Procedures', price: 90 },
        { name: 'Intravenous (IV) Setup & Saline', code: 'PROC-602', category: 'Clinical Procedures', price: 120 }
      ];
      await Service.insertMany(initialServices);
      console.log('✅ Seeding completed: 12 clinical items initialized.');
    }

    // 2. Seed Staff Accounts
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding clinical staff user accounts...');
      const initialUsers = [
        { username: 'owner', password: 'owner123', role: 'owner', fullName: 'Dr. Thansekar (Owner)' },
        { username: 'billing', password: 'billing123', role: 'billing', fullName: 'Billing Clerk' }
      ];
      // User.create triggers the password pre-save hash middleware hook
      for (const u of initialUsers) {
        await User.create(u);
      }
      console.log('✅ Seeding completed: Owner and Billing Clerk accounts initialized.');
    }
  } catch (error) {
    console.error('❌ Database Seeding Failed:', error);
  }
};

// Start Server
const startServer = async () => {
  // Connect database
  await connectDB();
  
  // Seed Database if connected
  const isDBConnected = mongoose.connection.readyState === 1;
  if (isDBConnected) {
    await seedDatabase();
  } else {
    console.log('⚠️ Database offline: Seeding skipped. Server will run on mock fallback mode.');
  }

  app.listen(PORT, () => {
    console.log(`⚡ Clinical API Server is running on port ${PORT}`);
  });
};

import mongoose from 'mongoose';
startServer();
