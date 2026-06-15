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

function decodeHtmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function sanitizeCJDescription(value) {
  if (!value) return '';
  let text = String(value);
  text = text.replace(/<br\s*\/?\s*>/gi, '\n');
  text = text.replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr)>/gi, '\n');
  text = text.replace(/<img\b[^>]*>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeHtmlEntities(text);
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .replace(/\n /g, '\n')
    .trim();
}

function extractDescriptionImages(value) {
  if (!value) return [];
  return [...new Set(
    String(value)
      .match(/https?:\/\/[^\s"'<>]+?\.(?:jpe?g|png|gif|webp)(?:\?[^\s"'<>]*)?/gi) || []
  )].slice(0, 10);
}

function productImages(cjProduct) {
  if (Array.isArray(cjProduct.productImageSet)) return cjProduct.productImageSet.filter(Boolean);
  if (Array.isArray(cjProduct.picture)) return cjProduct.picture.filter(Boolean);
  if (typeof cjProduct.picture === 'string') return cjProduct.picture.split(',').filter(Boolean);
  return [cjProduct.bigImage || cjProduct.productImage || cjProduct.image].filter(Boolean);
}

function productCategories(cjProduct) {
  const raw = firstValue(
    cjProduct.threeCategoryName,
    cjProduct.twoCategoryName,
    cjProduct.oneCategoryName,
    cjProduct.categoryName,
    'Imported'
  );
  return [...new Set(
    String(raw)
      .split(/[\/>|,]+/)
      .map(category => category.trim())
      .filter(Boolean)
  )];
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
  const description = sanitizeCJDescription(cjProduct.description || '');
  const categories = productCategories(cjProduct);
  const images = [...new Set([...productImages(cjProduct), ...extractDescriptionImages(cjProduct.description || '')])].slice(0, 10);
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
    description,
    category: categories[0] || 'Imported',
    categories,
    price: productPrice(cjProduct),
    images,
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
