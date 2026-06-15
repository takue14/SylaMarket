'use client';

import { useState } from 'react';
import Image from 'next/image';
import styled from 'styled-components';
import { Product } from '../data/products';
import { useCart } from '../contexts/CartContext';

interface Props {
  product: Product;
  onClose: () => void;
}

export default function Modal({ product, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { addToCart } = useCart();

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New review:', { rating, comment });
    setRating(0);
    setComment('');
  };

  return (
    <StyledWrapper onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>

        <Image src={product.image} alt={product.name} width={400} height={400} />

        <h2>{product.name}</h2>
        <p className="price">Price: ${product.price.toFixed(2)}</p>
        <p className="description">{product.description}</p>

        <ul className="specs">
          {product.specs.map(spec => <li key={spec}>{spec}</li>)}
        </ul>

        <div className="reviews">
          <h3>Reviews</h3>
          {product.reviewList.map((review, i) => (
            <div key={i} className="review">
              <p>{review.user}: {review.rating} ★ - {review.comment}</p>
            </div>
          ))}
        </div>

        <form className="form" onSubmit={handleSubmitReview}>
          <label>Rate:</label>
          <div className="stars">
            {[1,2,3,4,5].map(star => (
              <span
                key={star}
                onClick={() => setRating(star)}
                className={star <= rating ? 'active' : ''}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Leave a comment"
          />

          <button type="submit" className="form-submit-btn">
            Submit Review
          </button>
        </form>

        <button className="buy-btn" onClick={() => addToCart(product)}>
          Buy Now
        </button>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;


  .modal {
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: scroll;
    scrollbar-width: thin;
    scrollbar-radius: 20px;
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
    .modal::-webkit-scrollbar-button {
    display: none;}
.modal::-webkit-scrollbar {    width: 8px;}
.modal::-webkit-scrollbar-thumb {background: #888; border-radius: 20px;}

.close {
    position: absolute;
    top: 12px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 22px;
    cursor: pointer;
  }

  h2 {
    text-align: center;
    font-size: 20px;
    font-weight: 600;
  }

  .price {
    font-weight: 600;
    text-align: center;
    color: rgba(124, 58, 237, 1);
  }

  .description {
    font-size: 14px;
    opacity: 0.8;
    text-align: center;
  }

  .specs {
    padding-left: 18px;
    font-size: 13px;
    opacity: 0.85;
  }

  .reviews {
    background: rgba(124, 58, 237, 0.05);
    padding: 12px;
    border-radius: 8px;
  }

  .review {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stars span {
    font-size: 20px;
    cursor: pointer;
    color: gray;
    transition: 0.2s;
  }

  .stars span.active {
    color: gold;
    transform: scale(1.1);
  }

  textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-family: inherit;
  }

  textarea:focus {
    outline: none;
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
  }

  .form-submit-btn {
    background: rgba(124, 58, 237, 0.2);
    border: none;
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
  }

  .form-submit-btn:hover {
    background: rgba(124, 58, 237, 0.35);
  }

  .buy-btn {
    background: #212121;
    color: #fff;
    border: none;
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
  }

  .buy-btn:hover {
    background: #313131;
  }
`;