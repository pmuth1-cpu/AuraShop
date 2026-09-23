import { Navigate } from 'react-router-dom';
import { useSeller } from '../context/SellerAuthContext';

export default function SellerProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSeller();
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/seller/login" replace />;
  
  return children;
}
