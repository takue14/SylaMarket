'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { CartItem } from '@/context/CartContext';



interface Product {
  imageLink?: string;
}
export default function Checkout() {
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('Cash on Delivery');

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !contact.trim() || !location.trim()) {
      alert('Please fill in Name, Contact and Location');
      return;
    }

    setLoading(true);

    

            const methodMap: Record<string, 'cod' | 'ecocash' | 'paynow'> = {
      'Cash on Delivery': 'cod',
      'Ecocash': 'ecocash',
      'Bank': 'paynow',
    };

    const orderData = {
      customerName: customerName.trim(),
      contact: contact.trim(),
      location: location.trim(),
      paymentMethod: methodMap[selectedPayment] || 'cod',
      products: cart.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const order = await res.json();

      if (!res.ok) {
        alert(order.message || 'Failed to place order');
        return;
      }

      if (order.paymentMethod === 'cod') {
        alert('✅ Order placed! Pay the driver on delivery.');
        clearCart();
        router.push('/customer/dashboard');
        return;
      }

      // Online payment — initiate with Paynow
      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, phone: order.paymentMethod === 'ecocash' ? contact.trim() : undefined }),
      });
      const initData = await initRes.json();

      if (!initRes.ok) {
        alert(initData.message || 'Payment could not be started.');
        return;
      }

      clearCart();
      if (initData.redirectUrl) {
        window.location.href = initData.redirectUrl; // card/bank — send to Paynow's page
      } else {
        alert(initData.instructions || 'Check your phone to approve the payment.');
        router.push('/customer/dashboard');
      }
      
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Single-item instant buy
  const handleBuyNow = async (item: CartItem) => {
    if (!customerName.trim() || !contact.trim() || !location.trim()) {
      alert('Please fill in Name, Contact and Location first');
      return;
    }

       setLoading(true);

    const orderData = {
      customerName: customerName.trim(),
      contact: contact.trim(),
      location: location.trim(),
      paymentMethod: selectedPayment,
      products: [{ productId: item._id, quantity: item.quantity }],
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        alert(`✅ Order for ${item.productName} placed!`);
        router.push('/customer/dashboard');
      } else {
        alert('Failed to place order');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { name: 'Cash on Delivery', color: '#8B5CF6', icon: '🚚' },
    { name: 'Ecocash', color: '#10B981', icon: '📱' },
    { name: 'Bank', color: '#3B82F6', icon: '🏦' },
  ];

  return (
    <StyledWrapper>

      {/* ================= MOBILE VIEW ================= */}
      <div className="mobile-view">
        <div className="checkout-card">

          {/* TOP */}
          <div className="top-section">
            <div className="top-glow" />

            <div className="wallet-text">
              <span>Checkout</span>
              <p>Total amount to pay</p>
            </div>

            <div className="currency-tag">USD</div>

            {/* FIX: dollar sign now baseline-aligned with digits */}
            <div className="amount-wrapper">
              <span className="dollar">$</span>
              <h1 className="amount">{totalAmount.toFixed(2)}</h1>
            </div>

            <div className="selected-badge">{selectedPayment}</div>
          </div>

          {/* PAYMENT */}
          <div className="middle-wrapper">
            <div className="middle-section">
              <div className="payment-methods">
                {paymentMethods.map((method, i) => (
                  <div
                    key={i}
                    className={`payment-card ${selectedPayment === method.name ? 'active' : ''}`}
                    onClick={() => setSelectedPayment(method.name)}
                    style={{
                      background:
                        selectedPayment === method.name
                          ? `linear-gradient(135deg, ${method.color}, rgba(255,255,255,0.15))`
                          : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="payment-shine" />
                    <div className="payment-icon" style={{ color: method.color }}>{method.icon}</div>
                    <div className="payment-name">{method.name}</div>
                  </div>
                ))}
              </div>
              <div className="center-handle" />
            </div>
          </div>

          {/* BOTTOM */}
          <div className="bottom-section">
            <div className="section-title">Delivery Information</div>

            <div className="inputs-wrapper">
              <div className="input-box">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="input-box">
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="input-box">
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </div>

            <div className="section-title" style={{ marginTop: '24px' }}>
              Selected Products
            </div>

            <div className="products-list">
              {cart.map((item, i) => (
                <>
                <div key={i} className="product-card" style={{ animationDelay: `${i * 80}ms` }}>

                  <div className="product-left">
                    {/* FIX: image src pulled from item.imageUrl (set by your API/cart context) */}
                    <img
  className="product-image"
  src={item.imageLink || '/placeholder.png'}
  alt={item.productName}
  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
/>
                    <div className="product-info">
                      <h4>{item.productName}</h4>
                      <p>Qty: {item.quantity}</p>
                    </div>
                  </div>

                  {/* FIX: price + Buy Now button on the right */}
                  <div className="product-right">
                    <div className="product-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                  </div>

                </div>
                {/*<button
                      className="buy-now-btn"
                      onClick={() => handleBuyNow(item)}
                      disabled={loading}
                    >
                      Buy Now
                    </button>*/}
                    </>
              ))}
              
            </div>
          </div>

          <button
            className="floating-button"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            <span>{loading ? 'Placing...' : 'Place Order'}</span>
            <div className="floating-arrow">→</div>
          </button>

        </div>
      </div>

      {/* ================= PC VIEW ================= */}
      <div className="desktop-view">
        <div className="master-container">

          {/* FORM */}
          <div className="card">
            <label className="title">Checkout Details</label>
            <div className="form">
              <input
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input_field"
              />
              <input
                placeholder="Contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input_field"
              />
              <input
                placeholder="Delivery Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input_field"
              />
            </div>
          </div>

          {/* ITEMS */}
          <div className="card">
            <label className="title">Your Items</label>
            <div className="products">
              {cart.map((item, i) => (
                <div key={i} className="product">
                  {/* FIX: product image on PC view */}
                  <div className="product-pc-left">
                    <img
  className="product-image"
  src={item.imageLink || '/placeholder.png'}
  alt={item.productName}
  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
/>
                    <div>
                      <span>{item.productName}</span>
                      <p className="product-pc-qty">{item.quantity} × ${item.price}</p>
                    </div>
                  </div>

                  {/* Buy Now on PC */}
                  {/*<button
                    className="buy-now-pc"
                    onClick={() => handleBuyNow(item)}
                    disabled={loading}
                  >
                    Buy Now
                  </button>*/}
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL */}
          <div className="card checkout">
            <label className="title">Summary</label>
            <div className="details">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="checkout--footer">
              <button onClick={handlePlaceOrder} disabled={loading} className="checkout-btn">
                {loading ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>

        </div>
      </div>

    </StyledWrapper>
  );
}

/* ─── Animations ─────────────────────────────────────────── */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 4px 18px rgba(100,180,255,0.25); }
  50%       { box-shadow: 0 4px 28px rgba(100,180,255,0.55); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const StyledWrapper = styled.div`

  width: 100%;
  min-height: 100vh;
  background: #0f0f10;

  /* ── Toggle ── */
  .mobile-view  { display: block; }
  .desktop-view { display: none;  }

  @media (min-width: 769px) {
    .mobile-view  { display: none;  }
    .desktop-view { display: block; }
  }

  /* ══════════════════════════════════════════
     MOBILE VIEW
  ══════════════════════════════════════════ */

  .checkout-card {
    width: 100%;
    min-height: 100vh;
    background: #0f0f10;
    position: relative;
    overflow: hidden;
  }

  /* ── Top ── */
  .top-section {
    background: linear-gradient(180deg, #f3f0fb 0%, #ede7fb 100%);
    padding: 28px 24px 70px;
    position: relative;
    overflow: visible;
    z-index: 20;
    border-bottom-left-radius: 40px;
    border-bottom-right-radius: 40px;
  }

  .top-glow {
    position: absolute;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: rgba(139, 92, 246, 0.12);
    top: -80px; right: -50px;
    filter: blur(20px);
  }

  .wallet-text { position: relative; z-index: 2; }
  .wallet-text span { font-size: 18px; font-weight: 700; color: #111; }
  .wallet-text p { margin-top: 4px; font-size: 13px; color: #7b7b7b; }

  .currency-tag {
    width: fit-content;
    margin-top: 28px;
    padding: 7px 14px;
    border-radius: 999px;
    background: white;
    font-size: 12px;
    font-weight: 700;
    position: relative;
    z-index: 2;
  }

  /* FIX: baseline-aligned dollar + digits */
  .amount-wrapper {
    margin-top: 18px;
    display: flex;
    align-items: baseline;   /* ← key fix */
    gap: 2px;
    position: relative;
    z-index: 2;
  }

  .dollar {
    font-size: 26px;
    font-weight: 800;
    color: #111;
    line-height: 1;
  }

  .amount {
    font-size: clamp(48px, 9vw, 62px);
    line-height: 1;
    font-weight: 800;
    color: #111;
    margin: 0;
  }

  .selected-badge {
    position: absolute;
    bottom: -23px; left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #67d33f, #48b51f);
    color: white;
    padding: 9px 10px;
    border-radius: 999px;
    font-size: 13px; font-weight: 700;
    z-index: 10;
    box-shadow: 0 10px 20px rgba(72, 181, 31, 0.25);
    white-space: nowrap;
    border: 4px solid #0f0f10;
  }

  /* ── Payment ── */
  .middle-wrapper { position: relative; background: #0f0f10; }

  .middle-section {
    padding: 30px 0 30px;
    position: relative;
  }

  .payment-methods {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    scroll-behavior: smooth;
    padding: 0 20px;
    scrollbar-width: none;
  }
  .payment-methods::-webkit-scrollbar { display: none; }

  .payment-card {
    min-width: 155px; height: 83px;
    border-radius: 28px;
    padding: 15px;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border 0.25s ease;
    flex-shrink: 0;
    position: relative; overflow: hidden;
    backdrop-filter: blur(12px);
    transform: scale(0.97);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .payment-card.active {
    transform: scale(1.05);
    border: 1.5px solid rgba(255,255,255,0.3);
    box-shadow: 0 18px 30px rgba(0,0,0,0.3);
  }
  .payment-shine {
    position: absolute;
    width: 100px; height: 100px;
    background: rgba(255,255,255,0.12);
    border-radius: 50%;
    top: -60px; right: -30px;
  }
  .payment-icon {
    width: 35px; height: 35px;
    border-radius: 13px;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .payment-name { margin-top: 8px; font-size: 14px; color: white; font-weight: 600; line-height: 1.4; }

  .center-handle {
    width: 82px; height: 10px;
    background: #0d0d0d;
    border-radius: 999px;
    position: absolute; bottom: -5px; left: 50%;
    transform: translateX(-50%);
  }

  /* ── Bottom ── */
  .bottom-section {
    background: #f8f8f8;
    padding: 28px 18px 120px;
    border-top-left-radius: 34px;
    border-top-right-radius: 34px;
    margin-top: -10px;
    position: relative;
  }

  .section-title { font-size: 15px; color: #111; margin-bottom: 14px; font-weight: 700; }

  .inputs-wrapper { display: flex; flex-direction: column; gap: 14px; }

  .input-box {
    width: 100%; height: 56px;
    background: white;
    border-radius: 22px;
    padding: 0 16px;
    display: flex; align-items: center;
    border: 1px solid #ececec;
    transition: border 0.2s, box-shadow 0.2s;
  }
  .input-box:focus-within {
    border: 1.5px solid #8B5CF6;
    box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
  }
  .input-box input {
    width: 100%; border: none; outline: none;
    background: transparent; font-size: 14px; color: #111;
  }

  /* ── Product cards ── */
  .products-list { display: flex; flex-direction: column; gap: 14px; margin-top: 10px; }

  .product-card {
    background: white;
    border-radius: 24px;
    padding: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: ${slideUp} 0.4s ease both;
    transition: box-shadow 0.2s;
  }
  .product-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); }

  .product-left { display: flex; align-items: center; gap: 12px; }

  /* FIX: image now has a src; graceful fallback background */
  .product-image {
    width: 60px; height: 60px;
    border-radius: 18px;
    object-fit: cover;
    background: #f0eeff;
    flex-shrink: 0;
  }

  .product-info h4 { font-size: 14px; color: #111; margin-bottom: 4px; font-weight: 600; }
  .product-info p  { font-size: 12px; color: #777; }

  /* Right-side: price stacked above Buy Now */
  .product-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  .product-price { font-size: 16px; font-weight: 700; color: #111; }

  /* ── Buy Now button ── */
  .buy-now-btn {
    padding: 7px 14px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #8B5CF6, #6D28D9);
    color: white;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    animation: ${pulseGlow} 2.5s ease-in-out infinite;
  }
  .buy-now-btn:hover:not(:disabled) {
    transform: scale(1.06);
    box-shadow: 0 6px 18px rgba(109,40,217,0.35);
  }
  .buy-now-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Floating CTA ── */
  .floating-button {
    position: fixed;
    bottom: 18px; left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 40px);
    max-width: 390px;
    height: 64px;
    border: none;
    border-radius: 999px;
    background: white;
    color: black;
    font-size: 16px; font-weight: 700;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 10px 0 20px;
    z-index: 999;
    cursor: pointer;
    /* shimmer on idle */
    background: linear-gradient(
      90deg,
      #fff 0%, #f5f0ff 40%, #fff 60%, #f5f0ff 100%
    );
    background-size: 200% auto;
    animation: ${shimmer} 3s linear infinite;
    box-shadow: 0 8px 30px rgba(0,0,0,0.18);
    transition: transform 0.18s ease;
  }
  .floating-button:hover:not(:disabled) { transform: translateX(-50%) scale(1.02); }
  .floating-button:disabled { opacity: 0.7; cursor: not-allowed; }

  .floating-arrow {
    width: 46px; height: 46px;
    border-radius: 50%;
    background: black;
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }

  /* ══════════════════════════════════════════
     PC VIEW
  ══════════════════════════════════════════ */

  .master-container {
    display: grid;
    gap: 20px;
    justify-content: center;
    padding: 20px;
  }

  .card {
    width: 400px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0px 20px 40px rgba(0,0,0,0.08);
    animation: ${slideUp} 0.4s ease both;
  }

  .title {
    padding: 12px 20px;
    border-bottom: 1px solid #eee;
    font-weight: 700; font-size: 12px;
    color: black;
    display: block;
  }

  .form {
    padding: 15px;
    display: flex; flex-direction: column; gap: 10px;
  }

  .input_field {
    height: 36px;
    padding: 0 12px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    transition: border 0.2s;
  }
  .input_field:focus { outline: none; border-color: #8B5CF6; }

  .products { padding: 15px; }

  /* PC product row */
  .product {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: black;
  }

  .product-pc-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .product-pc-image {
    width: 42px; height: 42px;
    border-radius: 10px;
    object-fit: cover;
    background: #f0eeff;
    flex-shrink: 0;
  }

  .product-pc-qty {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
  }

  /* Buy Now on PC */
  .buy-now-pc {
    padding: 6px 14px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #8B5CF6, #6D28D9);
    color: white;
    font-size: 11px; font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    flex-shrink: 0;
  }
  .buy-now-pc:hover:not(:disabled) {
    transform: scale(1.06);
    box-shadow: 0 4px 14px rgba(109,40,217,0.3);
  }
  .buy-now-pc:disabled { opacity: 0.6; cursor: not-allowed; }

  .details {
    padding: 15px;
    display: flex; justify-content: space-between;
    color: black; font-weight: 700;
  }

  .checkout--footer {
    padding: 10px;
    background: #efeff3;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }

  .checkout-btn {
    width: 100%; height: 36px;
    background: linear-gradient(180deg, #4480FF, #0550ED);
    border: none; color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s, transform 0.15s;
  }
  .checkout-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.01); }
  .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
`;