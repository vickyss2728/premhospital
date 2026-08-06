import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hospital_billing';

export const connectDB = async (): Promise<void> => {
  try {
    // Configure mongoose options
    mongoose.set('strictQuery', true);
    
    console.log('⚡ Clinical System: Initiating connection to Database...');
    await mongoose.connect(MONGO_URI);
    
    console.log('🏥 Database Connected: Medical billing records database online.');
  } catch (error) {
    console.error('❌ Database Connection Error: Mongoose connection failed.');
    console.error(error);
    
    // Do not crash the application in development, allow mock data usage to keep UI functioning
    console.warn('⚠️ Warning: Proceeding in DEMO mode with temporary local state.');
  }
};
