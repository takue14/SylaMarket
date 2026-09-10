'use client';

import styled from 'styled-components';
import ProductCard from './ProductCard';
import { Product } from '@/types/product';

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 9997;
  opacity: ${(p) => (p.$isOpen ? 1 : 0)};
  visibility: ${p => (p.$isOpen ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
`;

const Panel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 85vh;
  background: var(--bg-base);
  border-radius: 20px 20px 0 0;
  z-index: 9998;
  transform: translateY(${p => (p.isOpen ? '0' : '100%')});
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  overflow-y: auto;
  padding: 16px;

  @media (min-width: 900px) {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: 90%;
    max-width: 1200px;
    max-height: 80vh;
    border-radius: 20px;
    transform: translate(-50%, ${p => (p.isOpen ? '-50%' : '-45%')});
    opacity: ${p => (p.isOpen ? 1 : 0)};
    visibility: ${p => (p.isOpen ? 'visible' : 'hidden')};
  }
`;


const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 480px) {
    gap: 6px;
  }
`;


const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: var(--bg-base);
  padding-bottom: 10px;
  z-index: 2;
`;

const Title = styled.h2`
  color: var(--text-primary);
  margin: 0;
  font-size: 1.3rem;
`;

const CloseBtn = styled.button`
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface Props {
  category: string | null;
  products: Product[];
  onClose: () => void;
  onProductClick: (product: Product) => void;
}

export default function CategoryProductsPanel({ category, products, onClose, onProductClick }: Props) {
  const isOpen = !!category;

  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <Panel isOpen={isOpen}>
        <Header>
          <Title>{category}</Title>
          <CloseBtn onClick={onClose} aria-label="Close">✕</CloseBtn>
        </Header>

        <ProductsGrid>
          {products.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No products in this category yet.
            </p>
          ) : (
            products.map(product => (
              <ProductCard key={product._id} product={product} onClick={() => onProductClick(product)} />
            ))
          )}
       </ProductsGrid>
      </Panel>
    </>
  );
}