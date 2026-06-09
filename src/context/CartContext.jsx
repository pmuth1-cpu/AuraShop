import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CAMBODIA_LOCATIONS = {
  "Banteay Meanchey": ["Mongkol Borei", "Phnum Srok", "Preah Netr Preah", "Ou Chrov", "Serei Saophoan", "Thma Puok", "Svay Chek", "Malai", "Paoy Paet"],
  "Battambang": ["Banan", "Thma Koul", "Battambang", "Bavel", "Aek Phnum", "Moung Ruessei", "Rotonak Mondol", "Sangkae", "Samlout", "Sampov Lun", "Phnum Proek", "Kamrieng", "Koas Krala", "Rukh Kiri"],
  "Kampong Cham": ["Batheay", "Chamkar Leu", "Cheung Prey", "Kampong Cham", "Kampong Siem", "Kang Meas", "Kaoh Soutin", "Prey Chhor", "Srei Santhor", "Stueng Trang"],
  "Kampong Chhnang": ["Baribour", "Chol Kiri", "Kampong Chhnang", "Kampong Leaeng", "Kampong Tralach", "Rolea Bier", "Sameakki Mean Chey", "Tuek Phos"],
  "Kampong Speu": ["Basedth", "Chbar Mon", "Kong Pisei", "Aoral", "Odongk", "Phnum Sruoch", "Samraong Tong", "Thpong"],
  "Kampong Thom": ["Baray", "Kampong Svay", "Stueng Saen", "Prasat Ballangk", "Prasat Sambour", "Sandan", "Santuk", "Stoung", "Taing Kouk"],
  "Kampot": ["Angkor Chey", "Banteay Meas", "Chhuk", "Chum Kiri", "Dang Tong", "Kampong Trach", "Tuek Chhou", "Kampot"],
  "Kandal": ["Kandal Stueng", "Kien Svay", "Khsach Kandal", "Kaoh Thum", "Leuk Daek", "Lvea Aem", "Mukh Kampul", "Angk Snuol", "Ponhea Lueu", "Sang", "Ta Khmau"],
  "Koh Kong": ["Botum Sakor", "Kiri Sakor", "Kaoh Kong", "Khemara Phoumin", "Mondol Seima", "Srae Ambel", "Thma Bang"],
  "Kratie": ["Chhloung", "Kracheh", "Prek Prasab", "Sambour", "Snuol", "Chetr Borei"],
  "Mondul Kiri": ["Kaev Seima", "Kaoh Nheaek", "Ou Reang", "Pech Chreada", "Saen Monourom"],
  "Phnom Penh": ["Chamkar Mon", "Doun Penh", "Prampir Meakkakra", "Tuol Kouk", "Dangkao", "Mean Chey", "Russey Keo", "Saensokh", "Pur SenChey", "Chraoy Chongvar", "Praek Pnov", "Chbar Ampov", "Boeng Keng Kang", "Kamboul"],
  "Preah Vihear": ["Chey Saen", "Chhaeb", "Choam Ksant", "Kuleaen", "Rovieng", "Sangkum Thmei", "Tbaeng Mean Chey", "Preah Vihear"],
  "Prey Veng": ["Ba Phnum", "Kamchay Mear", "Kampong Trabaek", "Kanhchriech", "Me Sang", "Peam Chor", "Peam Ro", "Pea Reang", "Preah Sdach", "Prey Veng", "Pur Rieng", "Sithor Kandal", "Svay Antor"],
  "Pursat": ["Bakan", "Kandieng", "Krakor", "Phnum Kravanh", "Pursat", "Veal Veaeng", "Ta Lou Senchey"],
  "Ratanak Kiri": ["Andoung Meas", "Ban Lung", "Bar Kaev", "Koun Mom", "Lumphat", "Ou Chum", "Ou Ya Dav", "Ta Veaeng", "Veun Sai"],
  "Siemreap": ["Angkor Chum", "Angkor Thum", "Banteay Srei", "Chi Kraeng", "Kralanh", "Puok", "Prasat Bakong", "Siem Reap", "Soutr Nikom", "Srei Snam", "Svay Leu", "Varin"],
  "Preah Sihanouk": ["Preah Sihanouk", "Prey Nob", "Stueng Hav", "Kampong Seila", "Kaoh Rung"],
  "Stung Treng": ["Sesan", "Siem Bouk", "Siem Pang", "Stueng Traeng", "Thala Barivat", "Borei Ou Svay Senchey"],
  "Svay Rieng": ["Chantrea", "Kampong Rou", "Rumduol", "Romeas Haek", "Svay Chrum", "Svay Rieng", "Svay Teab", "Bavet"],
  "Takeo": ["Angkor Borei", "Bati", "Borei Cholsar", "Kiri Vong", "Kaoh Andaet", "Prey Kabbas", "Samraong", "Doun Kaev", "Tram Kak", "Treang"],
  "Oddar Meanchey": ["Anlong Veaeng", "Banteay Ampil", "Chong Kal", "Samraong", "Trapeang Prasat"],
  "Kep": ["Damnak Changaeur", "Kaeb"],
  "Pailin": ["Pailin", "Sala Krau"],
  "Tboung Khmum": ["Dambae", "Krouch Chhmar", "Memot", "Ou Reang Ov", "Ponhea Kraek", "Suong", "Tboung Khmum"]
};

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_customer_info');
      return saved ? JSON.parse(saved) : { phone: '', province: '', district: '' };
    } catch { return { phone: '', province: '', district: '' }; }
  });

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('aura_customer_info', JSON.stringify(customerInfo));
  }, [customerInfo]);

  const addItem = (product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i._id !== id));
    toast('Item removed from cart', { icon: '🗑️' });
  };

  const clearCart = () => {
    setItems([]);
    setCustomerInfo({ phone: '', province: '', district: '' });
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const generateReceipt = () => {
    let receipt = '🛒 AURA SHOP ORDER\n\n';
    items.forEach((item) => {
      receipt += `${item.name} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    receipt += `\n💰 Total: $${totalPrice.toFixed(2)}\n`;
    if (customerInfo.phone || customerInfo.province) {
      receipt += '\n📍 Delivery Info:\n';
      if (customerInfo.phone) receipt += `Phone: ${customerInfo.phone}\n`;
      if (customerInfo.province) receipt += `Province: ${customerInfo.province}\n`;
      if (customerInfo.district) receipt += `District: ${customerInfo.district}\n`;
    }
    return receipt;
  };

  const checkoutViaTelegram = (username) => {
    setShowReceipt(true);
    const message = generateReceipt();
    const encoded = encodeURIComponent(message);
    window.open(`https://t.me/${username}?text=${encoded}`, '_blank');
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    clearCart();
  };

  const updateCustomerInfo = (info) => {
    setCustomerInfo(prev => ({ ...prev, ...info }));
  };

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice, checkoutViaTelegram, showReceipt, closeReceipt, customerInfo, updateCustomerInfo, CAMBODIA_LOCATIONS }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
