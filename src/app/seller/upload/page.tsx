'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerUpload() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!productName || !price || !category) {
      setError('Product name, price and category are required');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('description', description);
    if (image) formData.append('image', image);

    const sellerId = localStorage.getItem('sellerId');
    if (sellerId) formData.append('sellerId', sellerId);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccess('Product uploaded successfully!');
        // Reset form
        setProductName('');
        setPrice('');
        setCategory('');
        setDescription('');
        setImage(null);
        
        // Optional: redirect to seller dashboard after success
        setTimeout(() => {
          router.push('/seller/dashboard');
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to upload product');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '60px auto', 
      padding: '30px', 
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Upload New Product</h2>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Price ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Electronics, Fashion, Home"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description"
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '14px',
            background: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
    </div>
  );
}