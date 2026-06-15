import axios from 'axios';

const CJ_API_BASE = 'https://api.cjdropshipping.com';

async function cjRequest(endpoint, method = 'GET', body = null) {
  const token = process.env.CJ_API_TOKEN;
  if (!token) throw new Error('CJ_API_TOKEN not set in .env');

  const { data } = await axios({
    url: `${CJ_API_BASE}${endpoint}`,
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: body,
  });
  return data;
}

export async function getCJProducts(page = 1, pageSize = 50) {
  return cjRequest(`/api/product/list?page=${page}&pageSize=${pageSize}`);
}

export async function searchCJProducts(keyword, page = 1, pageSize = 50) {
  return cjRequest(`/api/product/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`);
}

export async function getCJProductDetail(cjProductId) {
  return cjRequest(`/api/product/detail?id=${cjProductId}`);
}

export async function getCJCategories() {
  return cjRequest('/api/product/categories');
}

export function mapCJProduct(cjProduct) {
  const images = Array.isArray(cjProduct.picture)
    ? cjProduct.picture.filter(Boolean)
    : (cjProduct.picture || '').split(',').filter(Boolean);

  return {
    name: cjProduct.productNameEn || cjProduct.productName || 'Imported Product',
    description: cjProduct.description || '',
    category: cjProduct.categoryName || 'Imported',
    price: String(cjProduct.sellPrice || cjProduct.price || 0),
    images,
    variants: (cjProduct.skuList || []).map(sku => ({
      size: sku.specs?.Size || sku.specs?.size || '',
      color: sku.specs?.Color || sku.specs?.color || '',
      price: String(sku.price || cjProduct.sellPrice || 0),
      stock: sku.stock ?? 99,
    })),
    inStock: (cjProduct.stock ?? 0) > 0,
    source: {
      platform: 'cjdropshipping',
      sourceId: String(cjProduct.productId || cjProduct.id || ''),
      sourceUrl: cjProduct.productUrl || '',
      supplierInfo: {
        warehouse: cjProduct.warehouse || '',
        deliveryDays: cjProduct.deliveryDays ?? null,
      },
      lastSynced: new Date(),
      markupPercent: 60,
    },
  };
}
