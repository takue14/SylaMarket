// src/components/RecommendedCard.tsx
import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';

interface Props {
  product: {
    _id: string;
    productName: string;
    price: number;
    imageLink?: string;
  };
  onClick: () => void;
}

const StyledWrapper = styled.div`
  .card {
    width: 250px;
    max-width: 420px;
    height: 80px;
    background: #353535;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: left;
    backdrop-filter: blur(10px);
    transition: 0.5s ease-in-out;
    overflow: hidden;
    padding-right: 10px;
  }

  .card:hover {
    cursor: pointer;
    transform: scale(1.05);
  }

  .img {
    width: 60px;
    height: 60px;
    margin-left: 10px;
    border-radius: 10px;
    background: linear-gradient(#d7cfcf, #9198e5);
    overflow: hidden;
  }

  .card:hover > .img {
    transition: 0.5s ease-in-out;
    background: linear-gradient(#9198e5, #712020);
  }

  .textBox {
    width: calc(100% - 90px);
    margin-left: 10px;
    color: white;
    font-family: 'Poppins', sans-serif;
  }

  .textContent {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .span {
    font-size: 10px;
  }

  .h1 {
    font-size: 16px;
    font-weight: bold;
  }

  .p {
    font-size: 12px;
    font-weight: lighter;
  }
`;

export default function RecommendedCard({ product, onClick }: Props) {
  return (
    <StyledWrapper>
      <div className="card" onClick={onClick}>
        <div className="img">
          {product.imageLink && (
            <Image 
              src={product.imageLink} 
              alt={product.productName} 
              width={60} 
              height={60} 
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>
        <div className="textBox">
          <div className="textContent">
            <p className="h1">{product.productName}</p>
            <span className="span">${product.price}</span>
          </div>
          <p className="p">Recommended for you</p>
        </div>
      </div>
    </StyledWrapper>
  );
}