import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  HiX,
  HiMinus,
  HiPlus,
  HiTrash,
  HiOutlineShoppingBag,
  HiCheckCircle,
  HiRefresh,
  HiShieldCheck,
} from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../api';
import toast from 'react-hot-toast';
import { playNotificationChime } from '../utils/browserNotification';

const DEFAULT_TELEGRAM = 'aurashop369';

export default function CartSidebar({ shop: propShop = null }) {
  const {
    items,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeItem,
    clearCart,
    transportCost,
    setTransportCost,
    grandTotal,
    subtotal,
    CAMBODIA_LOCATIONS,
  } = useCart();

  const { slug } = useParams();
  const shopSlug = propShop?.slug || slug || '';
  const telegramUsername = propShop?.telegram || DEFAULT_TELEGRAM;

  const [localInfo, setLocalInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_customer_info');
      return saved ? JSON.parse(saved) : { phone: '', telegram: '', province: '', district: '', commune: '', village: '' };
    } catch {
      return { phone: '', telegram: '', province: '', district: '', commune: '', village: '' };
    }
  });

  const [localTransport, setLocalTransport] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_local_transport');
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderQrImage, setOrderQrImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const pollTimerRef = useRef(null);

  // Sync customer info to localStorage
  useEffect(() => {
    localStorage.setItem('aura_customer_info', JSON.stringify(localInfo));
  }, [localInfo]);

  // Clean up poll timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Auto-poll Bakong API verification when order with KHQR is created and unpaid
  useEffect(() => {
    if (createdOrder && createdOrder.paymentMethod === 'khqr' && createdOrder.paymentStatus !== 'paid' && !orderCompleted) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await orderAPI.verifyBakong(createdOrder._id);
          if (res.data?.verified) {
            clearInterval(pollTimerRef.current);
            playNotificationChime();
            setOrderCompleted(true);
            setCreatedOrder(res.data.order);
            toast.success('Payment verified via Bakong! Order confirmed 🎉');
            clearCart();
          }
        } catch {
          // Keep polling silently
        }
      }, 4000);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }
  }, [createdOrder, orderCompleted]);

  if (!isOpen && !createdOrder) return null;

  const totalWithTransport = (subtotal + localTransport);

  // Handle Checkout submission
  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!localInfo.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shopSlug,
        shopId: propShop?._id,
        items,
        customerInfo: localInfo,
        transportCost: localTransport,
        paymentMethod,
      };

      const { data } = await orderAPI.create(payload);

      if (paymentMethod === 'telegram') {
        // Create order and redirect to Telegram
        playNotificationChime();
        const tgUser = data.telegram || telegramUsername;
        const locationText = [localInfo.village, localInfo.commune, localInfo.district, localInfo.province].filter(Boolean).join(', ');
        
        let msg = `/// AURA SHOP ORDER #${data.order.orderNumber}\n`;
        msg += `Phone: ${localInfo.phone}\n`;
        if (localInfo.telegram) msg += `Telegram: @${localInfo.telegram.replace('@', '')}\n`;
        msg += `Address: ${locationText || 'Phnom Penh'}\n\n`;
        msg += `=== ITEMS ===\n`;
        items.forEach((item, idx) => {
          msg += `${idx + 1}. ${item.name} ${item.variantInfo ? `[${item.variantInfo}]` : ''}\n`;
          msg += `   ${item.quantity} x $${Number(item.price).toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}\n`;
        });
        if (localTransport > 0) msg += `Transport: $${localTransport.toFixed(2)}\n`;
        msg += `\n=== TOTAL: $${totalWithTransport.toFixed(2)} ===\n`;
        msg += `Please confirm my order!`;

        const encoded = encodeURIComponent(msg);
        window.open(`https://t.me/${tgUser.replace('@', '')}?text=${encoded}`, '_blank');
        clearCart();
        setIsOpen(false);
        toast.success('Order placed! Redirected to Telegram.');
      } else if (paymentMethod === 'cod') {
        // Cash on delivery confirmed
        playNotificationChime();
        setCreatedOrder(data.order);
        setOrderCompleted(true);
        clearCart();
        toast.success('Order placed with Cash on Delivery!');
      } else {
        // KHQR
        setCreatedOrder(data.order);
        setOrderQrImage(data.qrImage);
        toast.success('Order created! Please scan KHQR to pay.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualVerifyOrder = async () => {
    if (!createdOrder?._id) return;
    setVerifyingPayment(true);
    try {
      const res = await orderAPI.verifyBakong(createdOrder._id);
      if (res.data?.verified) {
        playNotificationChime();
        setOrderCompleted(true);
        setCreatedOrder(res.data.order);
        toast.success('Payment verified via Bakong! 🎉');
        clearCart();
      } else {
        toast(res.data?.message || 'Payment not detected yet. Please ensure transfer is complete.', {
          icon: '⏳',
        });
      }
    } catch {
      toast.error('Verification check failed');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const closeAll = () => {
    setIsOpen(false);
    setCreatedOrder(null);
    setOrderQrImage(null);
    setOrderCompleted(false);
  };

  // Render Order Confirmation / KHQR Payment Screen
  if (createdOrder) {
    return (
      <>
        <div className="cart-overlay" onClick={closeAll} />
        <aside className="cart-sidebar" style={{ maxWidth: '440px' }}>
          <div className="cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiCheckCircle size={24} color="var(--success, #10b981)" />
              <h2 style={{ fontSize: '1.25rem' }}>
                {orderCompleted ? 'Order Confirmed!' : 'Scan & Pay KHQR'}
              </h2>
            </div>
            <button className="btn-icon" onClick={closeAll}><HiX size={18} /></button>
          </div>

          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order Number</span>
                <strong>{createdOrder.orderNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Amount</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                  ${Number(createdOrder.grandTotal).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Payment Status</span>
                <span className={`badge ${orderCompleted || createdOrder.paymentStatus === 'paid' ? 'in-stock' : 'out-of-stock'}`}>
                  {orderCompleted || createdOrder.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                </span>
              </div>
            </div>

            {/* KHQR Scannable QR if paymentMethod is khqr and not yet completed */}
            {!orderCompleted && createdOrder.paymentMethod === 'khqr' && orderQrImage && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  background: '#ffffff',
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'inline-block',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                }}>
                  <img
                    src={orderQrImage}
                    alt="Order Payment KHQR"
                    style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }}
                  />
                </div>

                <div style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Scan with <strong>Bakong, ABA, Wing, or ACLEDA</strong> app
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px',
                  fontSize: '0.82rem',
                  color: 'var(--accent-light)',
                }}>
                  <span className="spinner" style={{ width: '12px', height: '12px', margin: 0 }}></span>
                  Auto-verifying via Bakong API...
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleManualVerifyOrder}
                  disabled={verifyingPayment}
                  style={{ width: '100%', marginTop: '14px' }}
                >
                  <HiRefresh className={verifyingPayment ? 'animate-spin' : ''} />
                  {verifyingPayment ? 'Checking Bakong...' : 'Check Payment Status'}
                </button>
              </div>
            )}

            {/* Success state */}
            {orderCompleted && (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid var(--success, #10b981)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <HiCheckCircle size={48} color="var(--success, #10b981)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: 0, color: 'var(--success, #10b981)' }}>Thank You!</h3>
                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  The seller has received your order and will contact you shortly at <strong>{createdOrder.buyer?.phone}</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="cart-footer">
            <button className="btn btn-primary" onClick={closeAll} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Regular Cart Screen
  return (
    <>
      <div className="cart-overlay" onClick={() => setIsOpen(false)} />
      <aside className="cart-sidebar">
        <div className="cart-header">
          <h2>Your Cart ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
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
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  )}
                </div>
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  {item.variantInfo && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variantInfo}</span>
                  )}
                  <span className="cart-item-price">${Number(item.price).toFixed(2)}</span>
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
          <div className="cart-footer" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="cart-total" style={{ marginBottom: '14px' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {/* Buyer Contact & Location fields */}
            <div className="customer-info-form" style={{ gap: '10px', marginBottom: '16px' }}>
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Phone number (required for order)"
                  value={localInfo.phone}
                  onChange={(e) => setLocalInfo({ ...localInfo, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Telegram username (optional e.g. @yourname)"
                  value={localInfo.telegram}
                  onChange={(e) => setLocalInfo({ ...localInfo, telegram: e.target.value })}
                />
              </div>

              <div className="form-row">
                <select
                  value={localInfo.province}
                  onChange={(e) => setLocalInfo({ ...localInfo, province: e.target.value, district: '' })}
                >
                  <option value="">Province / City</option>
                  {Object.keys(CAMBODIA_LOCATIONS).map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>

                <select
                  value={localInfo.district}
                  onChange={(e) => setLocalInfo({ ...localInfo, district: e.target.value })}
                  disabled={!localInfo.province}
                >
                  <option value="">District</option>
                  {localInfo.province && CAMBODIA_LOCATIONS[localInfo.province]?.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  placeholder="Commune / Sangkat"
                  value={localInfo.commune}
                  onChange={(e) => setLocalInfo({ ...localInfo, commune: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Village / Street / House#"
                  value={localInfo.village}
                  onChange={(e) => setLocalInfo({ ...localInfo, village: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Delivery Fee:</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={localTransport}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setLocalTransport(val);
                    setTransportCost(val);
                  }}
                  style={{ width: '80px', padding: '6px 10px', textAlign: 'right', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
                Payment Method
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('khqr')}
                  className={`btn-sm ${paymentMethod === 'khqr' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}
                >
                  💳 Bakong
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telegram')}
                  className={`btn-sm ${paymentMethod === 'telegram' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}
                >
                  ✈️ Telegram
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`btn-sm ${paymentMethod === 'cod' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}
                >
                  💵 Cash (COD)
                </button>
              </div>
            </div>

            {/* Total Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--accent-light)' }}>${totalWithTransport.toFixed(2)}</span>
            </div>

            {/* Checkout Button */}
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Processing...' : (
                paymentMethod === 'khqr' ? '💳 Pay with Bakong KHQR' :
                paymentMethod === 'telegram' ? '✈️ Order via Telegram' :
                '💵 Confirm Cash on Delivery'
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
