import { HiX, HiMinus, HiPlus, HiTrash, HiOutlineShoppingBag } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { useCart } from '../context/CartContext';

const TELEGRAM_USERNAME = 'aurashop369';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, totalPrice, checkoutViaTelegram } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsOpen(false)} />
      <aside className="cart-sidebar">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="btn-icon" onClick={() => setIsOpen(false)}><HiX size={18} /></button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <HiOutlineShoppingBag />
              <span>Your cart is empty</span>
            </div>
          ) : (
            items.map(item => (
              <div className="cart-item" key={item._id}>
                <div className="cart-item-image">
                  {item.image && <img src={item.image} alt={item.name} />}
                </div>
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">${item.price.toFixed(2)}</span>
                  <div className="cart-item-actions">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}><HiMinus /></button>
                    <span className="cart-item-qty">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}><HiPlus /></button>
                    <button className="cart-item-remove" onClick={() => removeItem(item._id)}><HiTrash /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" onClick={() => checkoutViaTelegram(TELEGRAM_USERNAME)} id="checkout-telegram">
              <SiTelegram size={18} /> Checkout via Telegram
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
