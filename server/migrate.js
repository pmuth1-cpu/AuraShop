import { connectDB } from './db.js';

async function migrate() {
  try {
    await connectDB();
    console.log('Connected to DB');
    
    const { Product } = await import('./models/index.js');
    
    const result1 = await Product.updateMany(
      { sizes: { $exists: false } },
      { $set: { sizes: [] } }
    );
    console.log(`Added sizes field to ${result1.modifiedCount} products`);
    
    const result2 = await Product.updateMany(
      { colors: { $exists: false } },
      { $set: { colors: [] } }
    );
    console.log(`Added colors field to ${result2.modifiedCount} products`);
    
    const result3 = await Product.updateMany(
      { source: { $exists: false } },
      { $set: { 
        source: { 
          platform: 'manual', 
          sourceId: '', 
          sourceUrl: '', 
          supplierInfo: {}, 
          lastSynced: null, 
          markupPercent: 60 
        } 
      }}
    );
    console.log(`Added source field to ${result3.modifiedCount} products`);
    
    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
