import bcrypt from 'bcryptjs';
import { createAdmin, adminExists, createProduct } from './db.js';

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

async function seed() {
  const exists = await adminExists();
  if (exists) {
    console.log('⚠️  Database already seeded. Delete server/data/ folder to re-seed.');
    return;
  }

  // Create admin with hashed password
  const hashedPassword = await bcrypt.hash('kdmvtrovteroyban', 12);
  await createAdmin({ username: 'aurashop369', password: hashedPassword });
  console.log('👤 Admin created — username: aurashop369 / password: kdmvtrovteroyban (or @aurashop369)');

  // Create products
  for (const p of sampleProducts) {
    await createProduct(p);
  }
  console.log(`📦 ${sampleProducts.length} sample products created`);

  console.log('\n🎉 Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
