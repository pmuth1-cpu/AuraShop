import { HiX, HiMinus, HiPlus, HiTrash, HiOutlineShoppingBag, HiCheckCircle } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

const TELEGRAM_USERNAME = 'aurashop369';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, totalPrice, checkoutViaTelegram, showReceipt, closeReceipt, customerInfo, updateCustomerInfo, CAMBODIA_LOCATIONS } = useCart();
  const [localInfo, setLocalInfo] = useState({ phone: '', province: '', district: '', commune: '', village: '' });

  if (!isOpen && !showReceipt) return null;

  if (showReceipt) {
    return (
      <>
        <div className="cart-overlay" onClick={closeReceipt} />
        <aside className="cart-sidebar cart-receipt">
          <div className="receipt-header">
            <HiCheckCircle size={28} />
            <h2>Order Confirmed</h2>
            <p className="receipt-subtitle">Your order has been sent to Telegram</p>
          </div>

          <div className="cart-receipt-box">
            <div className="cart-receipt-border">
              <div className="cart-receipt-content">
                <pre className="receipt-ascii">
                  {`╔════════════════╗
    AURA  SHOP
  Order  Confirm
╚════════════════╝`}
                </pre>
                <div className="receipt-divider" />
                {customerInfo?.phone || customerInfo?.province ? (
                  <>
                    <pre className="receipt-label">📍 Delivery Info</pre>
                    <div className="receipt-items">
                      {customerInfo?.phone && <div className="receipt-item"><span className="receipt-item-detail">Phone: {customerInfo.phone}</span></div>}
                      {customerInfo?.province && <div className="receipt-item"><span className="receipt-item-detail">Province: {customerInfo.province}</span></div>}
                      {customerInfo?.district && <div className="receipt-item"><span className="receipt-item-detail">District: {customerInfo.district}</span></div>}
                    </div>
                    <div className="receipt-divider" />
                  </>
                ) : null}
                {customerInfo?.commune || customerInfo?.village ? (
                  <>
                    <pre className="receipt-label">🏘️ Address</pre>
                    <div className="receipt-items">
                      {customerInfo?.commune && <div className="receipt-item"><span className="receipt-item-detail">Commune: {customerInfo.commune}</span></div>}
                      {customerInfo?.village && <div className="receipt-item"><span className="receipt-item-detail">Village: {customerInfo.village}</span></div>}
                    </div>
                    <div className="receipt-divider" />
                  </>
                ) : null}
                <pre className="receipt-label">📦 ORDER SUMMARY</pre>
                <div className="receipt-items">
                  {items.map((item) => (
                    <div key={item._id} className="receipt-item">
                      <span className="receipt-item-name">▸ {item.name}</span>
                      <span className="receipt-item-detail">Quantity: {item.quantity}</span>
                      <span className="receipt-item-detail">Unit Price: ${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="receipt-divider" />
                <div className="receipt-total-row">
                  <span>💰 Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="receipt-divider" />
                <pre className="receipt-thanks">Thank you for your order!</pre>
              </div>
            </div>
          </div>

          <div className="cart-footer">
            <button className="btn btn-primary" onClick={closeReceipt} id="receipt-done">
              Done
            </button>
          </div>
        </aside>
      </>
    );
  }

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
            <div className="customer-info-form">
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={localInfo.phone}
                  onChange={(e) => setLocalInfo({...localInfo, phone: e.target.value})}
                />
              </div>
              <div className="form-row">
                <select
                  value={localInfo.province}
                  onChange={(e) => setLocalInfo({...localInfo, province: e.target.value, district: ''})}
                >
                  <option value="">Province (optional)</option>
                  {Object.keys(CAMBODIA_LOCATIONS).map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                <select
                  value={localInfo.district}
                  onChange={(e) => setLocalInfo({...localInfo, district: e.target.value})}
                  disabled={!localInfo.province}
                >
                  <option value="">District (optional)</option>
                   {localInfo.province && CAMBODIA_LOCATIONS[localInfo.province]?.map(district => (
                     <option key={district} value={district}>{district}</option>
                   ))}
                </select>
              </div>
              <div className="form-row">
                 <input
                   type="text"
                   placeholder="Commune/Sangkat (optional)"
                   value={localInfo.commune}
                   onChange={(e) => setLocalInfo({...localInfo, commune: e.target.value})}
                 />
                 <input
                   type="text"
                   placeholder="Village (optional)"
                   value={localInfo.village}
                   onChange={(e) => setLocalInfo({...localInfo, village: e.target.value})}
                 />
               </div>
            </div>
            <button className="btn btn-primary" onClick={() => {
              updateCustomerInfo(localInfo);
              checkoutViaTelegram(TELEGRAM_USERNAME);
            }} id="checkout-telegram">
              <SiTelegram size={18} /> Checkout via Telegram
            </button>
          </div>
        )}
      </aside>
    </>
  );
}