/**
 * Migration script: Migrate Admin data to User model.
 * Run once: node server/scripts/migrate-admin-to-user.js
 * 
 * This script:
 * 1. Reads existing admin accounts from the 'admins' collection
 * 2. Creates corresponding User documents with role: 'admin'
 * 3. Does NOT delete the old admin documents (safe migration)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const { User } = await import('../models/index.js');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists in User collection:', existingAdmin.email);
      console.log('   Skipping migration.');
      process.exit(0);
    }

    // Try to read from old admins collection
    const adminsCollection = mongoose.connection.collection('admins');
    const oldAdmins = await adminsCollection.find({}).toArray();

    if (oldAdmins.length === 0) {
      console.log('ℹ️  No old admin accounts found. Creating default admin...');
      const passwordHash = await bcrypt.hash('kdmvtrovteroyban', 12);
      await User.create({
        email: 'admin@aurashop.com',
        displayName: 'aurashop369',
        passwordHash,
        role: 'admin',
      });
      console.log('✅ Default admin created:');
      console.log('   Email: admin@aurashop.com');
      console.log('   Username: aurashop369');
      console.log('   Password: kdmvtrovteroyban');
    } else {
      for (const oldAdmin of oldAdmins) {
        console.log(`Migrating admin: ${oldAdmin.username}`);
        await User.create({
          email: `${oldAdmin.username}@aurashop.com`,
          displayName: oldAdmin.username,
          passwordHash: oldAdmin.password, // Already hashed
          role: 'admin',
        });
        console.log(`✅ Migrated: ${oldAdmin.username} → ${oldAdmin.username}@aurashop.com`);
      }
    }

    console.log('\n🎉 Migration complete!');
    console.log('You can now login with the admin credentials at /manage-aura-369/login');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
