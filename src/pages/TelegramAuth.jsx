import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useSeller } from '../context/SellerAuthContext';
import toast from 'react-hot-toast';

export default function TelegramAuth() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verifying your Telegram login...');
  const { refreshShop, setSession } = useSeller();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Invalid authentication link');
      navigate('/seller/login');
      return;
    }

    const authenticate = async () => {
      try {
        localStorage.setItem('seller_token', token);
        const res = await API.get('/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (setSession) {
          setSession(token, res.data.user, res.data.shop);
        }

        toast.success(`Welcome, ${res.data.user?.displayName || 'Seller'}!`);
        await refreshShop();

        if (res.data.shop) {
          navigate('/dashboard');
        } else {
          navigate('/seller/create-shop');
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('seller_token');
        toast.error('Authentication expired or invalid. Please sign in with your email or phone.');
        navigate('/seller/login');
      }
    };

    authenticate();
  }, [searchParams, navigate, refreshShop]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary, #0a0a11)',
      color: 'var(--text-primary, #fff)',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: '20px' }}></div>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Authenticating with Telegram...</h2>
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem' }}>{status}</p>
    </div>
  );
}
