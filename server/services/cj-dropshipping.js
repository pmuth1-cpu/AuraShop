import axios from 'axios';

const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

let cachedAccessToken = null;
let accessTokenExpiresAt = 0;

function clampPageSize(pageSize) {
  const value = Number(pageSize);
  if (Number.isNaN(value)) return 50;
  return Math.min(Math.max(value, 1), 100);
}

function getCJApiKey() {
  const key = process.env.CJ_API_TOKEN || process.env.CJ_API_KEY;
  if (!key) throw new Error('CJ_API_TOKEN not set in .env');
  return key;
}

async function requestAccessToken() {
  const { data } = await axios.post(`${CJ_API_BASE}/authentication/getAccessToken`, {
    apiKey: getCJApiKey(),
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (data?.result === false) {
    throw new Error(data.message || 'CJ API key is invalid');
  }

  const accessToken = data?.data?.accessToken;
  if (!accessToken) throw new Error('CJ API did not return an access token');

  const expiresAt = Date.parse(data.data.accessTokenExpiryDate || data.data.accessTokenExpiryDate || '');
  cachedAccessToken = accessToken;
  accessTokenExpiresAt = Number.isNaN(expiresAt) ? Date.now() + 12 * 60 * 60 * 1000 : expiresAt;
  return accessToken;
}

async function getCJAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60 * 1000) return cachedAccessToken;
  return requestAccessToken();
}

function normalizeCJData(data) {
  if (data?.result === false) {
    throw new Error(data.message || 'CJ API request failed');
  }
  return data?.data ?? data;
}

async function cjRequest(endpoint, method = 'GET', body = null) {
  const { data } = await axios({
    url: `${CJ_API_BASE}${endpoint}`,
    method,
    headers: {
      'CJ-Access-Token': await getCJAccessToken(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    data: body,
  });

  return normalizeCJData(data);
}

function productListFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.list)) return response.list;
  if (Array.isArray(response?.content)) return response.content.flatMap(item => item.productList || []);
  if (Array.isArray(response?.data?.list)) return response.data.list;
  if (Array.isArray(response?.data?.content)) return response.data.content.flatMap(item => item.productList || []);
  return [];
}

export async function getCJProducts(page = 1, pageSize = 50) {
  const size = clampPageSize(pageSize);
  return cjRequest(`/product/listV2?page=${page}&size=${size}&features=enable_description,enable_category`);
}

export async function searchCJProducts(keyword, page = 1, pageSize = 50) {
  const size = clampPageSize(pageSize);
  return cjRequest(`/product/listV2?page=${page}&size=${size}&keyWord=${encodeURIComponent(keyword)}&features=enable_description,enable_category`);
}

export async function getCJProductDetail(cjProductId) {
  return cjRequest(`/product/query?pid=${encodeURIComponent(cjProductId)}&features=enable_combine`);
}

export async function getCJCategories() {
  return cjRequest('/product/getCategory');
}

function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function variantStock(variant) {
  const inventories = variant.inventories || variant.stock || [];
  const total = inventories.reduce((sum, item) => sum + Number(item.totalInventoryNum ?? item.totalInventory ?? item.inventory ?? 0), 0);
  return total || Number(variant.stock ?? 0);
}

function productStock(cjProduct) {
  const inventories = cjProduct.inventories || cjProduct.stock || [];
  const total = inventories.reduce((sum, item) => sum + Number(item.totalInventoryNum ?? item.totalInventory ?? item.inventory ?? 0), 0);
  return total || Number(cjProduct.warehouseInventoryNum ?? cjProduct.totalVerifiedInventory ?? cjProduct.stock ?? 0);
}

function productImages(cjProduct) {
  if (Array.isArray(cjProduct.productImageSet)) return cjProduct.productImageSet.filter(Boolean);
  if (Array.isArray(cjProduct.picture)) return cjProduct.picture.filter(Boolean);
  if (typeof cjProduct.picture === 'string') return cjProduct.picture.split(',').filter(Boolean);
  return [cjProduct.bigImage || cjProduct.productImage || cjProduct.image].filter(Boolean);
}

function productCategory(cjProduct) {
  const names = [
    cjProduct.threeCategoryName,
    cjProduct.twoCategoryName,
    cjProduct.oneCategoryName,
    cjProduct.categoryName,
  ].filter(Boolean);
  return names.length ? names.join(' / ') : 'Imported';
}

function productPrice(cjProduct) {
  return String(firstValue(
    cjProduct.nowPrice,
    cjProduct.discountPrice,
    cjProduct.sellPrice,
    cjProduct.variantSellPrice,
    cjProduct.totalPrice,
    cjProduct.price,
    0
  ));
}

function productWarehouse(cjProduct) {
  if (cjProduct.defaultArea) return cjProduct.defaultArea;
  const inventory = (cjProduct.inventories || []).find(item => item.areaEn || item.countryNameEn || item.countryCode);
  return inventory?.areaEn || inventory?.countryNameEn || inventory?.countryCode || 'CJ';
}

export function mapCJProduct(cjProduct) {
  const variants = Array.isArray(cjProduct.variants)
    ? cjProduct.variants.map(variant => ({
        sku: variant.variantSku || variant.sku || '',
        size: variant.variantKey || variant.variantNameEn || '',
        color: '',
        price: String(firstValue(variant.variantSellPrice, cjProduct.sellPrice, cjProduct.nowPrice, cjProduct.price, 0)),
        stock: variantStock(variant),
      }))
    : (cjProduct.skuList || []).map(sku => ({
        sku: sku.sku || sku.variantSku || '',
        size: sku.specs?.Size || sku.specs?.size || sku.size || '',
        color: sku.specs?.Color || sku.specs?.color || sku.color || '',
        price: String(firstValue(sku.price, sku.variantSellPrice, cjProduct.sellPrice, cjProduct.nowPrice, 0)),
        stock: variantStock(sku),
      }));

  return {
    name: firstValue(cjProduct.nameEn, cjProduct.productNameEn, cjProduct.productName, 'Imported Product'),
    description: cjProduct.description || '',
    category: productCategory(cjProduct),
    price: productPrice(cjProduct),
    images: productImages(cjProduct),
    variants,
    inStock: productStock(cjProduct) > 0 || variants.some(variant => variant.stock > 0),
    source: {
      platform: 'cjdropshipping',
      sourceId: String(firstValue(cjProduct.pid, cjProduct.productId, cjProduct.id, cjProduct.productSku, cjProduct.sku, '') || ''),
      sourceUrl: '',
      supplierInfo: {
        warehouse: productWarehouse(cjProduct),
        deliveryDays: firstValue(cjProduct.deliveryCycle, cjProduct.deliveryDays, null),
      },
      lastSynced: new Date(),
      markupPercent: 60,
    },
  };
}

export { productListFromResponse };
