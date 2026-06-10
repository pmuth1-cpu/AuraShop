import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import CubeLoader from './components/CubeLoader';
import './index.css';

function Root() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide loader once everything is loaded
    const handleLoad = () => {
      setLoading(false);
    };
    
    if (document.readyState === 'complete') {
      setLoading(false);
    } else {
      window.addEventListener('load', handleLoad);
    }
    
    return () => window.removeEventListener('load', handleLoad);
  }, []);

  if (loading) {
    return <CubeLoader />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#e0e0e0',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
