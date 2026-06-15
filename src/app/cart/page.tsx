'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import styled from 'styled-components';
import Image from 'next/image';

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <PageWrapper>

      <PageTitle>Your Cart</PageTitle>

      {cart.length === 0 ? (

        <EmptyState>
          <span>🛒</span>
          <p>Your cart is empty</p>
          <Link href="/">
            <ShopBtn>Continue Shopping</ShopBtn>
          </Link>
        </EmptyState>

      ) : (

        <MasterContainer>

          {/* ── Cart Items ── */}
          <Card>
            <CardTitle>Items ({cart.length})</CardTitle>

            <ProductList>
              {cart.map(item => (
                <ProductRow key={item._id}>

                  <ProductImage>
                    {item.imageLink ? (
                      <Image
                        src={item.imageLink}
                        alt={item.productName}
                        width={60}
                        height={60}
                        style={{ borderRadius: '12px', objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    ) : (
                      <PlaceholderBox>📦</PlaceholderBox>
                    )}
                  </ProductImage>

                  <ProductInfo>
                    <ProductName>{item.productName}</ProductName>
                    <ProductMeta>Qty: {item.quantity}</ProductMeta>
                  </ProductInfo>

                  <ProductRight>
                    <ProductPrice>${(item.price * item.quantity).toFixed(2)}</ProductPrice>
                    <RemoveBtn onClick={() => removeFromCart(item._id)}>Remove</RemoveBtn>
                  </ProductRight>

                </ProductRow>
              ))}
            </ProductList>
          </Card>

          {/* ── Summary ── */}
          <Card>
            <CardTitle>Order Summary</CardTitle>

            <SummaryBody>
              <SummaryRow>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </SummaryRow>
              <SummaryRow>
                <span>Delivery</span>
                <span style={{ color: '#10b981' }}>Free</span>
              </SummaryRow>
              <Divider />
              <SummaryRow>
                <TotalLabel>Total</TotalLabel>
                <TotalAmount>${total.toFixed(2)}</TotalAmount>
              </SummaryRow>
            </SummaryBody>

            <FooterActions>
              <ClearBtn onClick={clearCart}>Clear Cart</ClearBtn>
              <Link href="/checkout" style={{ flex: 1 }}>
                <CheckoutBtn>Proceed to Checkout →</CheckoutBtn>
              </Link>
            </FooterActions>
          </Card>

        </MasterContainer>
      )}

    </PageWrapper>
  );
}

// ================== STYLES ==================

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 30px 20px 80px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 18px 14px 100px;
  }
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 16px;
  }
`;

const MasterContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-width: 560px;
  }
`;

const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
`;

const CardTitle = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 10px;
`;

const ProductRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card-deep);
  border-radius: 14px;
  padding: 12px;
`;

const ProductImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg-base);
`;

const PlaceholderBox = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProductMeta = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
`;

const ProductRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

const ProductPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
`;

const RemoveBtn = styled.button`
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }
`;

const SummaryBody = styled.div`
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-muted);
`;

const Divider = styled.div`
  height: 1px;
  background: var(--border);
`;

const TotalLabel = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
`;

const TotalAmount = styled.span`
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.5px;
`;

const FooterActions = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-card-deep);
`;

const ClearBtn = styled.button`
  padding: 11px 16px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: #ef4444;
    color: #ef4444;
  }
`;

const CheckoutBtn = styled.button`
  width: 100%;
  padding: 11px 16px;
  background: var(--accent);
  border: none;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.2s, transform 0.15s;

  &:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 80px 20px;
  text-align: center;

  span { font-size: 48px; }

  p {
    font-size: 16px;
    color: var(--text-muted);
    margin: 0;
  }
`;

const ShopBtn = styled.button`
  padding: 11px 24px;
  background: var(--accent);
  border: none;
  color: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.88; }
`;