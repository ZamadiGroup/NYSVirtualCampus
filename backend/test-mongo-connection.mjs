import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('Testing MongoDB connection...');
console.log('Connection string (masked):', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':****@'));

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    console.log('✅ MongoDB connected successfully!');
    console.log('📍 Database:', mongoose.connection.db?.databaseName);
    
    // List collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('📚 Collections:', collections?.map(c => c.name).join(', '));
    
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
