import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(items));
  }, [items]);

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

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const generateTelegramMessage = () => {
    let msg = '╔═══════════════ Aura Shop ═══════════════╗\n' +
              '            Order Confirmation\n' +
              '╚═══════════════╝\n\n' +
              '📦 Order Summary\n\n';
    items.forEach((item, idx) => {
      msg += `▸ ${item.name}\n` +
             `  Quantity: ${item.quantity}\n` +
             `  Unit Price: $${item.price.toFixed(2)}\n\n`;
    });
    msg += '──────────────────────\n' +
           `💰 Total Amount: $${totalPrice.toFixed(2)}\n` +
           '──────────────────────\n\n' +
           'Thank you for your order!';
    return msg;
  };

  const checkoutViaTelegram = (username) => {
    const message = generateTelegramMessage();
    const encoded = encodeURIComponent(message);
    window.open(`https://t.me/${username}?text=${encoded}`, '_blank');
  };

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice, checkoutViaTelegram }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
