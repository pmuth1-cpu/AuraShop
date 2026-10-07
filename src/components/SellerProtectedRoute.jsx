import { Navigate } from 'react-router-dom';
import { useSeller } from '../context/SellerAuthContext';

export default function SellerProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSeller();
  const token = localStorage.getItem('seller_token');
  
  if (loading || (!isAuthenticated && token)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '12px', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
        <span>Loading shop manager...</span>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/seller/login" replace />;
  }
  
  return children;
}
