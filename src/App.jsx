import { Routes, Route } from 'react-router-dom';
import StorePage from './pages/StorePage';
import CategoryPage from './pages/CategoryPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminProductForm from './pages/AdminProductForm';
import AdminCategories from './pages/AdminCategories';
import AdminCategoryForm from './pages/AdminCategoryForm';
import AdminCJSync from './pages/AdminCJSync';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/category/:name" element={<CategoryPage />} />
      <Route path="/manage-aura-369/login" element={<LoginPage />} />
      <Route path="/manage-aura-369" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/manage-aura-369/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
      <Route path="/manage-aura-369/products/new" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/products/edit/:id" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
      <Route path="/manage-aura-369/categories/new" element={<ProtectedRoute><AdminCategoryForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/categories/edit/:id" element={<ProtectedRoute><AdminCategoryForm /></ProtectedRoute>} />
      <Route path="/manage-aura-369/cj-sync" element={<ProtectedRoute><AdminCJSync /></ProtectedRoute>} />
    </Routes>
  );
}
