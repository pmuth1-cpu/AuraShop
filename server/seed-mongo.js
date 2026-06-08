import mongoose from 'mongoose';
import { connectDB } from './db.js';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

const MONGODB_URI = process.env.MONGODB_URI;

const sampleProducts = [
  { name: 'Midnight Noir Hoodie', description: 'Premium cotton blend hoodie with a minimal embossed logo. Features a relaxed fit, kangaroo pocket, and ultra-soft brushed interior.', price: 89.99, category: 'Hoodies', stock: 25, inStock: true, featured: true },
  { name: 'Eclipse Running Sneakers', description: 'Lightweight performance sneakers with responsive cushioning and breathable mesh upper. Perfect for everyday runs.', price: 149.99, category: 'Footwear', stock: 40, inStock: true, featured: true },
  { name: 'Phantom Crossbody Bag', description: 'Sleek crossbody bag crafted from water-resistant nylon with YKK zippers and adjustable strap.', price: 59.99, category: 'Accessories', stock: 60, inStock: true, featured: true },
  { name: 'Aura Classic Tee', description: 'Essential crew neck t-shirt in heavyweight 220GSM cotton. Garment-dyed for a lived-in feel.', price: 39.99, category: 'T-Shirts', stock: 100, inStock: true, featured: false },
  { name: 'Stealth Cargo Pants', description: 'Tactical-inspired cargo pants with 6 utility pockets, adjustable drawcord hem, and water-repellent DWR finish.', price: 109.99, category: 'Pants', stock: 30, inStock: true, featured: true },
  { name: 'Zenith Windbreaker', description: 'Ultralight packable windbreaker with reflective detailing. Seamless bonded construction.', price: 129.99, category: 'Outerwear', stock: 20, inStock: true, featured: false },
  { name: 'Halo Beanie', description: 'Ribbed knit beanie in premium merino wool blend. Soft, breathable, and perfect for layering.', price: 29.99, category: 'Accessories', stock: 80, inStock: true, featured: false },
  { name: 'Dusk Joggers', description: 'Tapered joggers in tech-fleece fabric with zippered pockets and elastic cuffs.', price: 79.99, category: 'Pants', stock: 45, inStock: true, featured: false },
];

const sampleCategories = [
  { name: 'Clothing' },
  { name: 'Footwear' },
  { name: 'Accessories' },
  { name: 'Outerwear' },
  { name: 'Pants' },
  { name: 'T-Shirts' },
  { name: 'Hoodies' },
];

async function seed() {
  if (!MONGODB_URI) {
    console.log('⚠️  MONGODB_URI not set. Skipping seed.');
    process.exit(0);
  }

  await connectDB();

  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) {
    console.log('⚠️  Database already seeded. Delete collections to re-seed.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);
  await Admin.create({ username: 'admin', password: hashedPassword });
  console.log('👤 Admin created — username: admin / password: admin123');

  await Category.insertMany(sampleCategories);
  console.log(`📁 ${sampleCategories.length} categories created`);

  await Product.insertMany(sampleProducts);
  console.log(`📦 ${sampleProducts.length} products created`);

  console.log('\n🎉 Seed complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
