'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

interface Product {
  _id: string;
  productName: string;
  price: number;
  category: string;
  description?: string;
  imageLink?: string;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem('sellerId');
    if (!id) {
      router.push('/seller/login');
      return;
    }
    setSellerId(id);

    fetch(`/api/sellers/${id}/products`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, [router]);

  const deleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    setProducts(products.filter((p) => p._id !== productId));
  };

  return (
    <Wrapper>
      <h1 className="title">Seller Dashboard</h1>
      <p className="subtitle">Welcome, Seller ID: {sellerId}</p>

      <button
        className="uploadBtn"
        onClick={() => router.push('/seller/upload')}
      >
        + Upload New Product
      </button>

      <div className="grid">
        {products.map((product) => (
          <div key={product._id} className="card">
            <div className="card__shine" />
            <div className="card__glow" />

            <div className="card__content">
              {product.imageLink && (
                <img
                  src={product.imageLink}
                  alt={product.productName}
                  className="card__image"
                />
              )}

              <div className="card__text">
                <p className="card__title">{product.productName}</p>
                <p className="card__description">{product.category}</p>
              </div>

              <div className="card__footer">
                <div className="card__price">${product.price}</div>
                <button
                  className="deleteBtn"
                  onClick={() => deleteProduct(product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 30px;
  font-family: sans-serif;

  .title {
    font-size: 28px;
    font-weight: 700;
  }

  .subtitle {
    margin-bottom: 20px;
    opacity: 0.7;
  }

  .uploadBtn {
    background: #7c3aed;
    color: white;
    padding: 10px 18px;
    border: none;
    border-radius: 10px;
    margin-bottom: 25px;
    cursor: pointer;
    transition: 0.3s;
  }

  .uploadBtn:hover {
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  /* CARD STYLE (ADAPTED FROM YOUR DESIGN) */
  .card {
    --card-bg: #ffffff;
    --card-accent: #7c3aed;
    --card-text: #1e293b;

    background: var(--card-bg);
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    padding: 10px;
    transition: 0.4s;
    box-shadow: 0 10px 15px rgba(0,0,0,0.05);
  }

  .card__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.8), transparent);
    opacity: 0;
  }

  .card__glow {
    position: absolute;
    inset: -10px;
    background: radial-gradient(circle at top, rgba(124,58,237,0.3), transparent);
    opacity: 0;
  }

  .card__content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card__image {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 12px;
  }

  .card__title {
    font-weight: 700;
  }

  .card__description {
    font-size: 12px;
    opacity: 0.7;
  }

  .card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card__price {
    font-weight: 700;
  }

  .deleteBtn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
  }

  /* HOVER EFFECTS */
  .card:hover {
    transform: translateY(-8px);
  }

  .card:hover .card__shine {
    opacity: 1;
  }

  .card:hover .card__glow {
    opacity: 1;
  }
`;