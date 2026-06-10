import { HiX, HiMinus, HiPlus, HiTrash, HiOutlineShoppingBag, HiCheckCircle } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

const TELEGRAM_USERNAME = 'aurashop369';

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, transportCost, setTransportCost, grandTotal, checkoutViaTelegram, showReceipt, closeReceipt, customerInfo, updateCustomerInfo, CAMBODIA_LOCATIONS } = useCart();
  const [localInfo, setLocalInfo] = useState({ phone: '', province: '', district: '', commune: '', village: '' });
  const [localTransport, setLocalTransport] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_local_transport');
      return saved ? Number(saved) || 0 : 0;
    } catch { return 0; }
  });

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
                <pre className="receipt-label">Phone number: {customerInfo?.phone || '(phone number)'}</pre>
                <pre className="receipt-label">Location: {[customerInfo?.province, customerInfo?.district, customerInfo?.commune, customerInfo?.village].filter(Boolean).length > 0 
                  ? [customerInfo?.province, customerInfo?.district, customerInfo?.commune, customerInfo?.village].filter(Boolean).join(', ')
                  : '(province), (district), (commune), (village)'}</pre>
                <pre className="receipt-label">🛒Cart summary</pre>
                <div className="receipt-items">
                  {items.map((item, idx) => (
                    <div key={item._id} className="receipt-item">
                      <pre className="receipt-item-name">{idx + 1}.{item.name}</pre>
                      <pre className="receipt-item-detail">   Qty: {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}</pre>
                    </div>
                  ))}
                </div>
                <pre className="receipt-divider">----------------------------------------</pre>
                <pre className="receipt-total-row">💲total: ${grandTotal.toFixed(2)}{(transportCost > 0 ? ` + ${transportCost.toFixed(2)}` : '')}</pre>
                <pre className="receipt-divider">----------------------------------------</pre>
                <pre className="receipt-thanks">📤Please confirm my order! Thank you!</pre>
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
              <span>${grandTotal.toFixed(2)}</span>
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
               <div className="form-group" style={{ marginTop: '12px' }}>
                 <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Transport Cost ($)</label>
                 <input
                   type="number"
                   min="0"
                   step="0.01"
                   value={localTransport}
                   onChange={(e) => {
                     const val = Math.max(0, Number(e.target.value) || 0);
                     setLocalTransport(val);
                     setTransportCost(val);
                   }}
                   style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                 />
               </div>
            </div>
            <button className="btn btn-primary" onClick={() => {
              updateCustomerInfo(localInfo);
              setTransportCost(localTransport);
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
