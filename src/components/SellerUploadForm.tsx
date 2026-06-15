// src/components/SellerUploadForm.tsx (fixed: use Next/Image for preview)
'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/SellerForm.module.css';
import styled from 'styled-components';

interface FormData {
  productName: string;
  price: number;
  category: string;
  description: string;
}

interface SellerUploadFormProps {
  onSuccess?: () => void;
}

const StyledWrapper = styled.div`
  .product-form {
    width: 350px;
    background-color: var(--bg-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 30px;
    gap: 20px;
    position: relative;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.082);
    border-radius: 15px;
  }

  .inputTab {
    background-color: var(--bg-base);
    color: var(--text-primary);
    padding: 1rem;
    padding-right: 3rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    width: 300px;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .formHeading {
    font-size: 1.1em;
    color: var(--text-primary);
    font-weight: 700;
  }

  .formSubheading {
    font-size: 0.9em;
    color: var(--text-primary);
    line-height: 17px;
    text-align: center;
    margin-bottom: 10px;
  }

  .inputContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items:center;
    justify-content: center;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 8px;
    border-radius: 7px;
    border: 1px solid var(--border-color);
    font-size: 1em;
    margin-bottom: 5px;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  .uploadButton {
    width: 100%;
    height: 35px;
    border: none;
    background-color: var(--accent-color);
    color: white;
    font-weight: 600;
    cursor: pointer;
    border-radius: 10px;
    transition-duration: .2s;
    margin-top: 10px;
  }

  .uploadButton:hover {
    background-color: var(--accent-color-hover);
    transition-duration: .2s;
  }

  .exitBtn {
    position: absolute;
    top: 5px;
    right: 5px;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.171);
    background-color: var(--bg-base);
    border-radius: 50%;
    width: 25px;
    height: 25px;
    border: none;
    color: black;
    font-size: 1.1em;
    cursor: pointer;
  }
`;

export default function SellerUploadForm({ onSuccess }: SellerUploadFormProps) {
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    price: 0,
    category: '',
    description: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.name === 'price' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId) return alert('Please log in first');
    if (!file) return alert('Please select an image');

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('productName', formData.productName);
    uploadFormData.append('price', formData.price.toString());
    uploadFormData.append('category', formData.category);
    uploadFormData.append('description', formData.description);
    uploadFormData.append('image', file);
    uploadFormData.append('sellerId', sellerId);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: uploadFormData,
      });
      if (res.ok) {
        alert('Product uploaded successfully!');
        setFormData({ productName: '', price: 0, category: '', description: '' });
        setFile(null);
        setPreview(null);
        onSuccess?.();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Upload failed');
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <StyledWrapper>
        <form onSubmit={handleSubmit} className="product-form">
          <span className="formHeading">Upload Product</span>
          <p className="formSubheading">Fill in the details to add your product</p>
          <div className="inputContainer">
            <input
              name="productName"
              placeholder="Product Name"
              value={formData.productName}
              onChange={handleChange}
              className="inputTab"
              required
            />
            <input
              name="price"
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              className="inputTab"
              required
              min={0}
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="inputTab"
              required
            >
              <option value="">Select Category</option>
              <option value="For Home">For Home</option>
              <option value="For Music">For Music</option>
              <option value="For Phone">For Phone</option>
              <option value="Other">Other</option>
            </select>
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="inputTab"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="inputTab"
              required
            />
            {preview && (
              <Image
                src={preview}
                alt="Preview"
                width={200}
                height={150}
                style={{ maxWidth: '200px', marginTop: '10px' }}
              />
            )}
          </div>
          <button className="uploadButton" type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Product'}
          </button>
          <button className="exitBtn" type="button" onClick={() => { /* Add close logic if needed */ }}>×</button>
        </form>
      </StyledWrapper>
    </div>
  );
}