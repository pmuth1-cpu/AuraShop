import express from 'express';
import { getCJProducts, searchCJProducts, getCJProductDetail, mapCJProduct } from '../services/cj-dropshipping.js';
import { createProduct, getAllProducts } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Step 1: Browse CJ catalog (returns previews, does NOT save to DB)
router.post('/browse', verifyToken, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 50 } = req.body;

    const response = keyword
      ? await searchCJProducts(keyword, page, pageSize)
      : await getCJProducts(page, pageSize);

    const cjProducts = response.data?.list || response.list || response.data?.products || [];

    const previews = cjProducts.slice(0, pageSize).map(cjProduct => {
      const mapped = mapCJProduct(cjProduct);
      const cjId = String(cjProduct.productId || cjProduct.id);

      return {
        cjId,
        name: mapped.name,
        price: mapped.price,
        images: mapped.images,
        category: mapped.category,
        inStock: mapped.inStock,
        variants: mapped.variants,
        sourceUrl: mapped.source.sourceUrl,
        warehouse: mapped.source.supplierInfo.warehouse,
      };
    });

    res.json({ products: previews, total: cjProducts.length });
  } catch (err) {
    console.error('CJ browse error:', err);
    res.status(500).json({ message: 'Browse failed', error: err.message });
  }
});

// Step 2: Import ONLY selected products into store
router.post('/import-selected', verifyToken, async (req, res) => {
  try {
    const { selectedCjIds } = req.body;
    if (!Array.isArray(selectedCjIds) || selectedCjIds.length === 0) {
      return res.status(400).json({ message: 'No products selected' });
    }

    const imported = [];
    const skipped = [];

    for (const cjId of selectedCjIds) {
      const existing = await getAllProducts({
        sourceId: cjId,
        platform: 'cjdropshipping',
      });
      if (existing.length > 0) {
        skipped.push(cjId);
        continue;
      }

      const detail = await getCJProductDetail(cjId);
      const cjProduct = detail.data || detail;
      const mapped = mapCJProduct(cjProduct);

      const created = await createProduct({
        ...mapped,
        merchant: req.admin.id,
      });

      imported.push({ cjId, auraId: created._id, name: created.name });
    }

    res.json({
      imported: imported.length,
      skipped: skipped.length,
      products: imported,
    });
  } catch (err) {
    console.error('CJ import error:', err);
    res.status(500).json({ message: 'Import failed', error: err.message });
  }
});

// Resync single product
router.post('/resync/:id', verifyToken, async (req, res) => {
  try {
    const product = await getAllProducts({
      sourceId: req.params.id,
      platform: 'cjdropshipping',
    });
    if (!product.length) return res.status(404).json({ message: 'Product not found in CJ' });

    const detail = await getCJProductDetail(req.params.id);
    const cjProduct = detail.data || detail;
    const mapped = mapCJProduct(cjProduct);

    const { updateProduct } = await import('../db.js');
    const updated = await updateProduct(product[0]._id, {
      ...mapped,
      source: { ...mapped.source, lastSynced: new Date() },
    });

    res.json({ updated: true, product: updated });
  } catch (err) {
    res.status(500).json({ message: 'Resync failed', error: err.message });
  }
});

export default router;
