'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import styled from 'styled-components';
import { useNotification } from '@/context/NotificationContext';
import ImageCarousel from './ImageCarousel';


interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSelectRelated?: (product: Product) => void;
}

// ================== STYLES ==================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(5px);
`;

const Modal = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 22px;
  width: 100%;
  max-width: 780px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  color: var(--text-primary);

  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 16px;
  background: var(--bg-card-deep);
  border: none;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

const TopSection = styled.div`
  display: flex;
  gap: 24px;
  padding: 28px 28px 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    padding: 20px 18px 16px;
  }
`;

const ImageSection = styled.div`
  flex-shrink: 0;
  width: 240px;

  img {
    width: 100%;
    height: auto;
    border-radius: 16px;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    width: 100%;
    max-width: 300px;
    align-self: center;
  }
`;

const DetailsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
`;

const ProductTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
`;

const PriceTag = styled.p`
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.5px;
`;

const Description = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.6;
`;
const SellerLine = styled.p`
  margin: -4px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const AddToCartBtn = styled.button`
  padding: 10px 22px;
  background: var(--bg-card-deep);
  color: var(--accent);
  border: 1.5px solid var(--accent);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: var(--accent);
    color: white;
    transform: translateY(-2px);
  }
`;
const RelatedRow = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
`;

const RelatedCard = styled.div`
  flex: 0 0 180px;
  background: var(--bg-card, #eef0e4);
  border-radius: 22px;
  padding: 10px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-3px);
  }

  .rc-price {
    position: absolute;
    top: 18px;
    right: 18px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.55);
    color: white;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
  }

  .rc-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 4px 2px;
  }

  h4 {
    font-size: 13.5px;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary, #111);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 110px;
  }

  .rc-order {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent, #5b6cff);
    white-space: nowrap;
  }
`;

const BuyNowWrapper = styled.div`
  .button {
    --width: 110px;
    --height: 38px;
    --tooltip-height: 32px;
    --tooltip-width: 100px;
    --gap-between-tooltip-to-button: 16px;
    --button-color: #5b6cff;
    width: var(--width);
    height: var(--height);
    background: var(--button-color);
    position: relative;
    text-align: center;
    border-radius: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.3s;
  }

  .button::before {
    position: absolute;
    content: attr(data-tooltip);
    width: var(--tooltip-width);
    height: var(--tooltip-height);
    background-color: var(--bg-card-deep);
    font-size: 0.8rem;
    color: var(--text-primary);
    border-radius: 8px;
    line-height: var(--tooltip-height);
    bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) + 10px);
    left: calc(50% - var(--tooltip-width) / 2);
  }

  .button::after {
    position: absolute;
    content: '';
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-top-color: var(--bg-card-deep);
    left: calc(50% - 8px);
    bottom: calc(100% + var(--gap-between-tooltip-to-button) - 10px);
  }

  .button::after,
  .button::before {
    opacity: 0;
    visibility: hidden;
    transition: all 0.5s;
  }

  .button-wrapper,
  .text,
  .icon {
    overflow: hidden;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    color: #fff;
  }

  .text {
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
  }

  .text, .icon { transition: top 0.5s; }

  .icon {
    color: #fff;
    top: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon svg { width: 20px; height: 20px; }

  .button:hover { background: #4352e0; }
  .button:hover .text { top: -100%; }
  .button:hover .icon { top: 0; }

  .button:hover::before,
  .button:hover::after {
    opacity: 1;
    visibility: visible;
  }

  .button:hover::after {
    bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) - 20px);
  }

  .button:hover::before {
    bottom: calc(var(--height) + var(--gap-between-tooltip-to-button));
  }

  
`;

const Divider = styled.div`
  height: 1px;
  background: var(--border);
  margin: 0 28px;

  @media (max-width: 600px) { margin: 0 18px; }
`;

const ReviewsSection = styled.div`
  padding: 22px 28px 28px;

  @media (max-width: 600px) { padding: 18px 18px 24px; }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
`;

const ReviewCard = styled.div`
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ReviewUser = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
`;

const StarDisplay = styled.span`
  font-size: 14px;
  color: #ff9e0b;
  letter-spacing: 1px;
`;

const ReviewText = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
`;

const EmptyReviews = styled.p`
  color: var(--text-dim);
  font-size: 13.5px;
  text-align: center;
  padding: 20px 0;
`;

const FormBox = styled.div`
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  margin-top: 6px;
`;

const FormTitle = styled.p`
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
`;

const StarRatingWrapper = styled.div`
  margin-bottom: 14px;

  .radio {
  display: flex;
  flex-direction: row-reverse;   // ← renders stars right-to-left in DOM
  justify-content: flex-end;     // ← but visually they sit left-to-right
  gap: 8px;
}

  .radio > input {
    position: absolute;
    appearance: none;
  }

  .radio > label {
    cursor: pointer;
    font-size: 26px;
    position: relative;
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .radio > label > svg {
    fill: var(--text-dim);
    transition: fill 0.3s ease;
  }

  .radio > label::before,
  .radio > label::after {
    content: "";
    position: absolute;
    width: 5px;
    height: 5px;
    background-color: #ff9e0b;
    border-radius: 50%;
    opacity: 0;
    transform: scale(0);
    transition: transform 0.4s ease, opacity 0.4s ease;
  }

  .radio > label::before {
    top: -12px;
    left: 50%;
    transform: translateX(-50%) scale(0);
  }

  .radio > label::after {
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%) scale(0);
  }

  .radio > label:hover::before,
  .radio > label:hover::after {
    opacity: 1;
    transform: translateX(-50%) scale(1.5);
  }

  .radio > label:hover {
    transform: scale(1.2);
    animation: pulse 0.6s infinite alternate;
  }

  .radio > label:hover > svg {
    fill: #ff9e0b;
    filter: drop-shadow(0 0 10px rgba(255, 158, 11, 0.9));
    animation: shimmer 1s ease infinite alternate;
  }

  .radio > input:checked + label > svg {
    fill: #ff9e0b;
    filter: drop-shadow(0 0 10px rgba(255, 158, 11, 0.9));
  }

  .radio input:checked ~ label svg { fill: #ffa723; }

  @keyframes pulse {
    0%   { transform: scale(1); }
    100% { transform: scale(1.1); }
  }

  @keyframes shimmer {
    0%   { filter: drop-shadow(0 0 8px rgba(255, 158, 11, 0.5)); }
    100% { filter: drop-shadow(0 0 18px rgba(255, 158, 11, 1)); }
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-base);
  color: var(--text-primary);
  font-size: 13px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  min-height: 80px;

  &::placeholder { color: var(--text-dim); }
  &:focus { border-color: var(--accent); }
`;

const SubmitBtn = styled.button`
  margin-top: 12px;
  padding: 10px 22px;
  background: linear-gradient(135deg, #3730a3, #5b6cff);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;

  &:hover {
    opacity: 0.88;
    transform: translateY(-2px);
  }
`;

const StarLabel = styled.p`
  font-size: 11px;
  color: var(--text-dim);
  margin: 0 0 8px;
`;

// ================== COMPONENT ==================

export default function ProductModal({ product, isOpen, onClose, onSelectRelated }: ProductModalProps) {
  const { addToCart, buyNow } = useCart();
  const { notify } = useNotification();

    const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    if (!isOpen || !product._id) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${product._id}`);
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews');
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [isOpen, product._id]);

    useEffect(() => {
    if (!isOpen || !product.category) return;
    fetch(`/api/products?category=${encodeURIComponent(product.category)}&limit=10`)
      .then((res) => res.json())
      .then((data: Product[]) => setRelated(data.filter((p) => p._id !== product._id).slice(0, 8)))
      .catch(() => setRelated([]));
  }, [isOpen, product.category, product._id]);

  const handleAddToCart = () => {
    const added = addToCart(product);
    if (added) notify(`${product.productName} added to cart!`, 'success');
  };

  const handleBuyNow = () => {
    const proceeded = buyNow(product);
    if (proceeded) onClose();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const customerId = localStorage.getItem('customerId');
    const customerName = 'Anonymous';

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, customerId, customerName, rating, comment }),
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews(prev => [newReview, ...prev]);
        setComment('');
        notify('Review submitted successfully!', 'success');
      }
    } catch (err) {
      notify('Failed to submit review', 'error');
    }
  
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>

        <CloseBtn onClick={onClose}>×</CloseBtn>

        <TopSection>
                   <ImageSection>
            <ImageCarousel
              images={product.images?.length ? product.images : product.imageLink ? [product.imageLink] : []}
              alt={product.productName}
              height={240}
              borderRadius={16}
            />
          </ImageSection>

          <DetailsSection>
            <ProductTitle>{product.productName}</ProductTitle>
                        {product.salePrice != null && product.salePrice < product.price ? (
              <PriceTag>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.55em', marginRight: 8 }}>
                  ${product.price.toFixed(2)}
                </span>
                ${product.salePrice.toFixed(2)}
              </PriceTag>
            ) : (
              <PriceTag>${product.price.toFixed(2)}</PriceTag>
            )}
                        <Description>{product.description || 'No description available.'}</Description>
            <SellerLine>Sold by {product.seller?.businessName || product.seller?.name || 'Unknown seller'}</SellerLine>

            <ActionRow>
              <AddToCartBtn onClick={handleAddToCart}>+ Add to Cart</AddToCartBtn>

              <BuyNowWrapper>
                <div data-tooltip={`Price: $${product.price}`} className="button" onClick={handleBuyNow}>
                  <div className="button-wrapper">
                    <div className="text">Buy Now</div>
                    <span className="icon">
                      <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </BuyNowWrapper>
            </ActionRow>
          </DetailsSection>
        </TopSection>

        <Divider />

        <ReviewsSection>
          <SectionTitle>Customer Reviews</SectionTitle>

          {loadingReviews ? (
            <EmptyReviews>Loading reviews...</EmptyReviews>
          ) : reviews.length === 0 ? (
            <EmptyReviews>No reviews yet. Be the first to review!</EmptyReviews>
          ) : (
            <ReviewList>
              {reviews.map(review => (
                <ReviewCard key={review._id}>
                  <ReviewHeader>
                    <ReviewUser>{review.customerName}</ReviewUser>
                    <StarDisplay>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </StarDisplay>
                  </ReviewHeader>
                  <ReviewText>{review.comment}</ReviewText>
                </ReviewCard>
              ))}
            </ReviewList>
          )}

          <FormBox>
            <FormTitle>Leave a Review</FormTitle>
            <form onSubmit={handleSubmitReview}>
              <StarLabel>Your Rating</StarLabel>

              <StarRatingWrapper>
                <div className="radio">
                  {[5, 4, 3, 2, 1].map(r => (
                    <>
                      <input
                        key={`input-${r}`}
                        type="radio"
                        name="rating"
                        id={`rating-${r}`}
                        value={r}
                        checked={rating === r}
                        onChange={() => setRating(r)}
                      />
                      <label key={`label-${r}`} htmlFor={`rating-${r}`} title={`${r} star${r > 1 ? 's' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                          <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                        </svg>
                      </label>
                    </>
                  ))}
                </div>
              </StarRatingWrapper>

              <FormTextarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
              />

              <SubmitBtn type="submit">Submit Review</SubmitBtn>
            </form>
          </FormBox>
        </ReviewsSection>


        {related.length > 0 && (
          <>
            <Divider />
            <ReviewsSection>
              <SectionTitle>You may also like</SectionTitle>
              <RelatedRow>
                                {related.map((r) => (
                  <RelatedCard key={r._id} onClick={() => onSelectRelated?.(r)}>
                    <div className="rc-price">${r.price.toFixed(0)}</div>
                    <ImageCarousel
                      images={r.images?.length ? r.images : r.imageLink ? [r.imageLink] : []}
                      alt={r.productName}
                      height={140}
                      borderRadius={20}
                    />
                    <div className="rc-body">
                      <h4>{r.productName}</h4>
                      <span className="rc-order">View →</span>
                    </div>
                  </RelatedCard>
                ))}
              </RelatedRow>
            </ReviewsSection>
          </>
        )}
      </Modal>
    </Overlay>
  );
}