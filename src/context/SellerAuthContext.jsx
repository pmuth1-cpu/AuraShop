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

  const setSession = (token, userData, shopData) => {
    if (token) localStorage.setItem('seller_token', token);
    if (userData) setSeller(userData);
    if (shopData !== undefined) setShop(shopData);
  };

  const register = async (formData) => {
    const { data } = await API.post('/auth/register', formData);
    if (data.token) {
      setSession(data.token, data.user, data.shop);
    }
    return data;
  };

  const sendOTP = async (phone) => {
    const { data } = await API.post('/auth/otp/send', { phone });
    return data;
  };

  const loginWithOTP = async (phone, otp, displayName) => {
    const { data } = await API.post('/auth/otp/verify', { phone, otp, displayName });
    setSession(data.token, data.user, data.shop);
    return data;
  };

  const login = async (loginId, password) => {
    const { data } = await API.post('/auth/login', { email: loginId, username: loginId, phone: loginId, password });
    if (data.user?.role !== 'seller') throw new Error('Not a seller account');
    setSession(data.token, data.user, data.shop);
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
      if (!token) return null;
      const { data } = await API.get('/shops/my', { headers: { Authorization: `Bearer ${token}` } });
      setShop(data);
      return data;
    } catch {
      return null;
    }
  };

  return (
    <SellerAuthContext.Provider value={{
      seller,
      shop,
      loading,
      login,
      register,
      loginWithOTP,
      sendOTP,
      logout,
      refreshShop,
      setSession,
      setSeller,
      setShop,
      isAuthenticated: !!seller,
    }}>
      {children}
    </SellerAuthContext.Provider>
  );
}

export const useSeller = () => useContext(SellerAuthContext);
