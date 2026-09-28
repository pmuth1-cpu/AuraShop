import { Routes, Route } from 'react-router-dom';

// Public pages
import PlatformHome from './pages/PlatformHome';
import BrowseShops from './pages/BrowseShops';
import ShopStorefront from './pages/ShopStorefront';
import CategoryPage from './pages/CategoryPage';

// Seller auth pages
import SellerRegister from './pages/SellerRegister';
import SellerLogin from './pages/SellerLogin';
import CreateShop from './pages/CreateShop';
import TelegramAuth from './pages/TelegramAuth';

// Seller dashboard pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerOrders from './pages/seller/SellerOrders';
import SellerProducts from './pages/seller/SellerProducts';
import SellerProductForm from './pages/seller/SellerProductForm';
import ShopSettings from './pages/seller/ShopSettings';
import SubscriptionPage from './pages/seller/SubscriptionPage';
import SellerProtectedRoute from './components/SellerProtectedRoute';

// Admin pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminProductForm from './pages/AdminProductForm';
import AdminCategories from './pages/AdminCategories';
import AdminCategoryForm from './pages/AdminCategoryForm';
import ManageSellers from './pages/admin/ManageSellers';
import PendingApprovals from './pages/admin/PendingApprovals';
import PlatformRevenue from './pages/admin/PlatformRevenue';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PlatformHome />} />
      <Route path="/shops" element={<BrowseShops />} />
      <Route path="/shop/:slug" element={<ShopStorefront />} />
      <Route path="/category/:name" element={<CategoryPage />} />

      {/* Seller Auth */}
      <Route path="/seller/register" element={<SellerRegister />} />
      <Route path="/seller/login" element={<SellerLogin />} />
      <Route path="/seller/telegram-auth" element={<TelegramAuth />} />
      <Route path="/seller/create-shop" element={<SellerProtectedRoute><CreateShop /></SellerProtectedRoute>} />

      {/* Seller Dashboard */}
      <Route path="/dashboard" element={<SellerProtectedRoute><SellerDashboard /></SellerProtectedRoute>} />
      <Route path="/dashboard/orders" element={<SellerProtectedRoute><SellerOrders /></SellerProtectedRoute>} />
      <Route path="/dashboard/products" element={<SellerProtectedRoute><SellerProducts /></SellerProtectedRoute>} />
      <Route path="/dashboard/products/new" element={<SellerProtectedRoute><SellerProductForm /></SellerProtectedRoute>} />
      <Route path="/dashboard/products/edit/:id" element={<SellerProtectedRoute><SellerProductForm /></SellerProtectedRoute>} />
      <Route path="/dashboard/settings" element={<SellerProtectedRoute><ShopSettings /></SellerProtectedRoute>} />
      <Route path="/dashboard/subscription" element={<SellerProtectedRoute><SubscriptionPage /></SellerProtectedRoute>} />

      {/* Admin */}
      <Route path="/manage-aura-369/login" element={<LoginPage />} />
      <Route path="/manage-aura-369" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/manage-aura-369/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
      <Route path="/manage-aura-369/products/new" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/products/edit/:id" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
      <Route path="/manage-aura-369/categories/new" element={<ProtectedRoute><AdminCategoryForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/categories/edit/:id" element={<ProtectedRoute><AdminCategoryForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/sellers" element={<ProtectedRoute><ManageSellers /></ProtectedRoute>} />
      <Route path="/manage-aura-369/approvals" element={<ProtectedRoute><PendingApprovals /></ProtectedRoute>} />
      <Route path="/manage-aura-369/revenue" element={<ProtectedRoute><PlatformRevenue /></ProtectedRoute>} />
    </Routes>
  );
}
