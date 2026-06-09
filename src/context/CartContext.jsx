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
      return saved ? JSON.parse(saved) : { phone: '', province: '', district: '', commune: '', village: '' };
    } catch { return { phone: '', province: '', district: '', commune: '', village: '' }; }
  });
  const [transportCost, setTransportCost] = useState(() => Number(localStorage.getItem('aura_transport_cost')) || 0);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('aura_customer_info', JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    localStorage.setItem('aura_transport_cost', transportCost);
  }, [transportCost]);

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
    setCustomerInfo({ phone: '', province: '', district: '', commune: '', village: '' });
    setTransportCost(0);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const transportCostVal = Number(transportCost || 0);
  const grandTotal = subtotal + transportCostVal;

  const generateReceipt = () => {
    let receipt = '';
    receipt += '╔════════════════╗\n';
    receipt += '                AURA  SHOP\n';
    receipt += '             Order  Confirm\n';
    receipt += '╚════════════════╝\n';
    if (customerInfo.phone) {
      const phone = String(customerInfo.phone || '').replace(/undefined|null/g, '').trim();
      if (phone) receipt += `Phone number: ${phone}\n`;
    }
    const location = [customerInfo.province, customerInfo.district, customerInfo.commune, customerInfo.village].filter(Boolean).map(v => String(v).replace(/undefined|null/g, '').trim()).filter(Boolean).join(', ');
    if (location) receipt += `Location: ${location}\n`;
    receipt += '\nCart summary\n';
    items.forEach((item, idx) => {
      const name = String(item.name || '').replace(/undefined|null/g, '').trim();
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const lineTotal = qty * price;
      receipt += `${idx + 1}.${name}\n`;
      receipt += `   Qty: ${qty} x $${price.toFixed(2)} = $${lineTotal.toFixed(2)}\n`;
    });
    receipt += `transport cost: ${transportCostVal.toFixed(2)}\n`;
    receipt += '__________________\n';
    receipt += `total: ${grandTotal.toFixed(2)}\n`;
    receipt += '__________________\n';
    receipt += 'Please confirm my order! Thank you!';
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
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, updateQuantity, removeItem, clearCart, totalItems, subtotal, transportCost: transportCostVal, setTransportCost, grandTotal, checkoutViaTelegram, showReceipt, closeReceipt, customerInfo, updateCustomerInfo, CAMBODIA_LOCATIONS }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
