import { useState, useEffect, useRef } from 'react';
import { paymentAPI } from '../../api';
import { useSeller } from '../../context/SellerAuthContext';
import SellerSidebar from '../../components/SellerSidebar';
import toast from 'react-hot-toast';
import { HiCheckCircle, HiRefresh, HiShieldCheck } from 'react-icons/hi';
import { playNotificationChime } from '../../utils/browserNotification';

export default function SubscriptionPage() {
  const { shop, refreshShop } = useSeller();
  const [payments, setPayments] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const pollTimerRef = useRef(null);

  const fetchPayments = async () => {
    try {
      const { data } = await paymentAPI.getMyPayments();
      setPayments(data.payments || []);
      // If there is an active pending subscription payment, set it
      const pending = (data.payments || []).find(p => p.status === 'pending');
      if (pending) {
        setCurrentPayment(pending);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll Bakong verification while a QR is displayed and payment is pending
  useEffect(() => {
    if (currentPayment && currentPayment.status === 'pending') {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await paymentAPI.verifyBakong(currentPayment._id);
          if (res.data?.verified) {
            clearInterval(pollTimerRef.current);
            playNotificationChime();
            toast.success('Payment verified successfully via Bakong! 🎉');
            setQrCode(null);
            setCurrentPayment(null);
            fetchPayments();
            refreshShop();
          }
        } catch {
          // Keep polling silently
        }
      }, 5000);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }
  }, [currentPayment]);

  const handlePayNow = async () => {
    setLoading(true);
    try {
      const { data } = await paymentAPI.subscribe();
      const paymentObj = data.payment;
      setCurrentPayment(paymentObj);
      setQrCode(data.qrImage);
      toast.success(data.message || 'Scan the KHQR code to pay $2.50');
      fetchPayments();
      refreshShop();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payment QR');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerifyBakong = async () => {
    if (!currentPayment?._id) return;
    setVerifying(true);
    try {
      const res = await paymentAPI.verifyBakong(currentPayment._id);
      if (res.data?.verified) {
        playNotificationChime();
        toast.success(res.data.message || 'Payment confirmed via Bakong! 🎉');
        setQrCode(null);
        setCurrentPayment(null);
        fetchPayments();
        refreshShop();
      } else {
        toast(res.data?.message || 'Payment not detected yet. Please ensure transfer is complete.', {
          icon: '⏳',
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification check failed');
    } finally {
      setVerifying(false);
    }
  };

  const isExpired = !shop?.subscriptionPaidUntil || new Date(shop.subscriptionPaidUntil) < new Date();

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Subscription Management</h1>
        </div>

        {isExpired ? (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--danger, #ef4444)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
          }}>
            <h3 style={{ color: 'var(--danger, #ef4444)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Subscription Expired
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
              Your shop subscription has ended. Please renew for $2.50/month to keep your storefront active.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid var(--success, #10b981)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
          }}>
            <h3 style={{ color: 'var(--success, #10b981)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiCheckCircle size={22} /> Active Subscription
            </h3>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
              Active until: <strong>{new Date(shop.subscriptionPaidUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </p>
          </div>
        )}

        {/* Subscription Plan Card */}
        <div className="stat-card" style={{ maxWidth: '440px', marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Platform Plan
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <HiShieldCheck size={16} color="var(--accent)" /> Bakong Verified
            </span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Standard Seller Shop</h2>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '14px 0', color: 'var(--text-primary)' }}>
            $2.50 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ month</span>
          </div>

          {!qrCode ? (
            <button
              className="btn btn-primary"
              onClick={handlePayNow}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Generating KHQR...' : (isExpired ? 'Pay Now via KHQR' : 'Renew Subscription')}
            </button>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <div style={{
                background: '#ffffff',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                display: 'inline-block',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}>
                <img
                  src={qrCode}
                  alt="Bakong KHQR Payment"
                  style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }}
                />
              </div>

              <div style={{ marginTop: '14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Scan with any <strong>Bakong, ABA, Wing, or ACLEDA</strong> banking app.
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
                fontSize: '0.82rem',
                color: 'var(--accent-light)',
              }}>
                <span className="spinner" style={{ width: '14px', height: '14px', margin: 0 }}></span>
                Auto-checking with Bakong API...
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleManualVerifyBakong}
                disabled={verifying}
                style={{ width: '100%', marginTop: '14px' }}
              >
                <HiRefresh className={verifying ? 'animate-spin' : ''} />
                {verifying ? 'Checking...' : 'Check Payment Status'}
              </button>
            </div>
          )}
        </div>

        {/* Payment History */}
        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Payment History</h2>
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Period</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td><strong>${Number(p.amount || 2.5).toFixed(2)}</strong></td>
                  <td>Bakong KHQR</td>
                  <td>
                    <span className={`badge ${p.status === 'verified' ? 'in-stock' : 'out-of-stock'}`}>
                      {p.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {p.periodEnd ? new Date(p.periodEnd).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No payment history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
