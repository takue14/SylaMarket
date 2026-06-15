'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

export default function SellerUpload() {
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    category: '',
    description: '',
    quantity: '10',
  });
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId) return alert('Please login as seller');

    const data = new FormData();
    data.append('productName', formData.productName);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('quantity', formData.quantity);
    data.append('sellerId', sellerId);
    if (image) data.append('image', image);

    const res = await fetch('/api/products', {
      method: 'POST',
      body: data,
    });

    if (res.ok) {
      alert('Product uploaded successfully!');
      router.push('/seller/dashboard');
    } else {
      alert('Upload failed');
    }
    setUploading(false);
  };

  return (
    <StyledWrapper>
      <div className="form-container">
        <div className="logo-container">Upload New Product</div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              placeholder="Enter product name"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              placeholder="Enter category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Initial Stock Quantity</label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </div>

          <button className="form-submit-btn" type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Product'}
          </button>
        </form>

        <button onClick={() => router.push('/seller/dashboard')} className="back-btn">
          Go to My Dashboard
        </button>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);

  
  .form-container {
    max-width: 500px;
    width: 100%;
    background-color: var(--bg-base);
    padding: 40px 30px;
    border:var(--border);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }

  .logo-container {
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 30px;
    color: var(--text-primary);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 8px;
    font-weight: 600;
    color: #4b0082;
  }

  .form-group input,
  .form-group textarea {
    padding: 14px;
    border: 2px solid #d8b4fe;
    border-radius: 8px;
    font-size: 16px;
  }

  .form-submit-btn {
    background: #7c3aed;
    color: white;
    border: none;
    padding: 16px;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
  }

  .back-btn {
    margin-top: 20px;
    width: 100%;
    padding: 14px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
  }
`;