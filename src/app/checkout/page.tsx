'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styled from 'styled-components';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !contact.trim() || !location.trim()) {
      alert('Please fill in Name, Contact and Location');
      return;
    }

    setLoading(true);

    const customerId = localStorage.getItem('customerId');

    const orderData = {
      customerId,
      customerName: customerName.trim(),
      contact: contact.trim(),
      location: location.trim(),
      products: cart.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        alert('✅ Order placed successfully!');
        clearCart();
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

  return (
    <StyledWrapper>
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
                <span>{item.productName}</span>
                <p>{item.quantity} × ${item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TOTAL */}
        <div className="card checkout">
          <label className="title">Summary</label>

          <div className="details">
            <span>Total:</span>
            <span>${totalAmount}</span>
          </div>

          <div className="checkout--footer">
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="checkout-btn"
            >
              {loading ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </div>

      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
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
  }

  .title {
    padding: 12px 20px;
    border-bottom: 1px solid #eee;
    font-weight: 700;
    font-size: 12px;
  }

  .form {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input_field {
    height: 36px;
    padding: 0 12px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
  }

  .products {
    padding: 15px;
  }

  .product {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .checkout--footer {
    padding: 10px;
    background: #efeff3;
  }

  .checkout-btn {
    width: 100%;
    height: 36px;
    background: linear-gradient(180deg, #4480FF, #0550ED);
    border: none;
    color: white;
    border-radius: 6px;
    cursor: pointer;
  }
`;