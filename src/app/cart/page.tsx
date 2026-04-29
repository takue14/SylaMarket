'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import styled from 'styled-components';

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <StyledWrapper>
      <div className="master-container">
        <div className="card cart">
          <label className="title">Your Cart</label>

          {cart.length === 0 ? (
            <p style={{ padding: '15px' }}>Your cart is empty</p>
          ) : (
            <div className="products">
              {cart.map((item) => (
                <div key={item._id} className="product">
                  <div>
                    <span>{item.productName}</span>
                    <p>${item.price} × {item.quantity}</p>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="card checkout">
            <label className="title">Summary</label>

            <div className="details">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="checkout--footer">
              <button onClick={clearCart} className="clear-btn">
                Clear Cart
              </button>

              <Link href="/checkout">
                <button className="checkout-btn">
                  Proceed to Checkout
                </button>
              </Link>
            </div>
          </div>
        )}
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
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.08);
  }

  .title {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 20px;
    border-bottom: 1px solid #efeff3;
    font-weight: 700;
    font-size: 12px;
    color: #63656b;
  }

  .products {
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 10px;
  }

  .product {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product span {
    font-size: 14px;
    font-weight: 600;
    color: #47484b;
  }

  .product p {
    font-size: 12px;
    color: #7a7c81;
  }

  .remove-btn {
    background: transparent;
    border: 1px solid #e5e5e5;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }

  .checkout .details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 15px;
  }

  .checkout--footer {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: #efeff3;
  }

  .checkout-btn {
    background: linear-gradient(180deg, #4480ff 0%, #115dfc 50%, #0550ed 100%);
    border: none;
    color: white;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }

  .clear-btn {
    background: transparent;
    border: 1px solid #ccc;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }
`;