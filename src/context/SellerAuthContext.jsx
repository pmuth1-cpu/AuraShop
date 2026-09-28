import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const SellerAuthContext = createContext();

export function SellerAuthProvider({ children }) {
  const [seller, setSeller] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('seller_token');
    if (token) {
      API.get('/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setSeller(res.data.user);
          setShop(res.data.shop);
        })
        .catch(() => localStorage.removeItem('seller_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const sendOTP = async (phone) => {
    const { data } = await API.post('/auth/otp/send', { phone });
    return data;
  };

  const loginWithOTP = async (phone, otp, displayName) => {
    const { data } = await API.post('/auth/otp/verify', { phone, otp, displayName });
    localStorage.setItem('seller_token', data.token);
    setSeller(data.user);
    setShop(data.shop);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    if (data.user.role !== 'seller') throw new Error('Not a seller account');
    localStorage.setItem('seller_token', data.token);
    setSeller(data.user);
    setShop(data.shop);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('seller_token');
    setSeller(null);
    setShop(null);
  };

  const refreshShop = async () => {
    try {
      const token = localStorage.getItem('seller_token');
      const { data } = await API.get('/shops/my', { headers: { Authorization: `Bearer ${token}` } });
      setShop(data);
    } catch { /* ignore */ }
  };

  return (
    <SellerAuthContext.Provider value={{ seller, shop, loading, login, loginWithOTP, sendOTP, logout, refreshShop, isAuthenticated: !!seller }}>
      {children}
    </SellerAuthContext.Provider>
  );
}

export const useSeller = () => useContext(SellerAuthContext);
