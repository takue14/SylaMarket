'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useNotification } from '@/context/NotificationContext';
import SellerLocationPrompt from '@/components/SellerLocationPrompt';

const CATEGORIES = ['Home', 'Music', 'Phone', 'Shoes', 'Hats', 'Other'];

export default function SellerUpload() {
  const { notify } = useNotification();
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    category: '',
    description: '',
    quantity: '10',
    segment: 'dealo',
  });
    const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [locationReady, setLocationReady] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId) {
      router.push('/seller/login');
      return;
    }
        fetch(`/api/users/seller/${sellerId}/location`)
      .then((res) => res.json())
      .then((data) => setLocationReady(!!data.hasLocation))
      .catch(() => setLocationReady(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId) {
      setError('Please login as a seller first.');
      return;
    }
        if (images.length === 0) {
      setError('Upload at least one product image.');
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append('productName', formData.productName);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('quantity', formData.quantity);
      data.append('segment', formData.segment);
      data.append('sellerId', sellerId);
           images.forEach((img) => data.append('images', img));

      const res = await fetch('/api/products', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Upload failed');
      }

      notify('Product uploaded successfully!', 'success');
      router.push('/seller/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Location gate: must come before the form's return below ──
  if (locationReady === false) {
    return (
      <SellerLocationPrompt
        sellerId={localStorage.getItem('sellerId')!}
        onSaved={() => setLocationReady(true)}
      />
    );
  }
  if (locationReady === null) {
    return null;
  }

  return (
    <StyledWrapper>
      <div className="form-container">
        <div className="logo-container">Upload New Product</div>

        {error && <div className="error-banner">{error}</div>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              className="input"
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
              className="input"
              placeholder="Enter price"
              value={formData.price}
              min="0"
              step="0.01"
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Storefront</label>
            <select
              className="input"
              value={formData.segment}
              onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
              required
            >
              <option value="dealo">Dealo (general marketplace)</option>
              <option value="dealo-fresh">Dealo Fresh (home basics — groceries, kitchenware)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="input"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Initial Stock Quantity</label>
            <input
              type="number"
              className="input"
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              min="0"
              required
            />
          </div>

          <div className="form-group file-upload-group">
            <label>Product Images (1–4)</label>
            <div className="file-upload-form">
              <label className="file-upload-label" htmlFor="images">
                <div className="file-upload-design">
                  <svg height="1em" viewBox="0 0 640 512">
                    <path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V392c0 13.3 10.7 24 24 24s24-10.7 24-24V257.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0l-80 80z" />
                  </svg>
                  <p>Drag and Drop</p>
                  <p>or</p>
                  <span className="browse-button">Browse file</span>
                </div>
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []).slice(0, 4);
                    if ((e.target.files?.length || 0) > 4) {
                      notify('Only the first 4 images were kept — max 4 allowed.', 'warning');
                    }
                    setImages(selected);
                  }}
                />
              </label>
            </div>
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${i + 1}`}
                    className="image-preview"
                    style={{ width: 90, maxWidth: 90 }}
                  />
                ))}
              </div>
            )}
          </div>

          <button className="form-submit-btn" type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Product'}
          </button>
        </form>

        <button
          onClick={() => router.push('/seller/dashboard')}
          className="back-btn"
          type="button"
        >
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
    border: var(--border);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .logo-container {
    text-align: center;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 30px;
    color: var(--text-primary);
  }

    .error-banner {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 14px;
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
    color: var(--accent, #4b0082);
  }

  .file-upload-group{
  dsplay: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  }

  /* ── merged from Input component ── */
    .input {
    border: 2px solid var(--border);
    width: 100%;
    height: 2.8em;
    padding-left: 0.8em;
    outline: none;
    overflow: hidden;
    background-color: var(--bg-input, var(--bg-card));
    color: var(--text-primary);
    border-radius: 10px;
    transition: all 0.5s;
    font-size: 16px;
    box-sizing: border-box;
  }
  .input:hover,
  .input:focus {
    border: 2px solid #995ae6;
    box-shadow: 0px 0px 0px 7px rgb(74, 157, 236, 20%);
    background-color: var(--bg-card);
  }
  textarea.input {
    height: auto;
    padding-top: 0.6em;
    resize: vertical;
  }

  .image-preview {
    margin-top: 10px;
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 8px;
    border: 2px solid #d8b4fe;
  }

  /* ── merged from Form (file upload) component ── */
  .file-upload-form {
    width: fit-content;
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .file-upload-label input {
    display: none;
  }
  .file-upload-label svg {
    height: 50px;
    fill: rgb(82, 82, 82);
    margin-bottom: 20px;
  }
    .file-upload-label {
    cursor: pointer;
    background-color: var(--bg-card-deep, #ddd);
    padding: 30px 70px;
    border-radius: 40px;
    border: 2px dashed var(--border);
    box-shadow: 0px 0px 200px -50px rgba(0, 0, 0, 0.719);
  }
  .file-upload-design {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
    .browse-button {
    background-color: var(--text-primary);
    padding: 5px 15px;
    border-radius: 10px;
    color: var(--bg-base);
    transition: all 0.3s;
  }
  .browse-button:hover {
    opacity: 0.85;
  }

  .form-submit-btn {
    background: #7c3aed;
    color: white;
    border: none;
    padding: 16px;
    border-radius: 15px;
    font-size: 18px;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #6d28d9;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .back-btn {
    margin-top: 20px;
    width: 100%;
    padding: 14px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;

    &:hover {
      background: #4b5563;
    }
  }
`;