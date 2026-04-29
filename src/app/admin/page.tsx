'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  totalAmount: number;
  status: 'pending' | 'inprogress' | 'delivered';
}

interface Product {
  _id: string;
  productName: string;
  price: number;
  category: string;
  seller?: { 
  _id: string; 
  businessName: string 
};
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeSellers: number;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeSellers: 0,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  

  useEffect(() => {
    fetchProductsAndAnalytics();
  }, []);

  const fetchProductsAndAnalytics = async () => {
    try {
      // Get ALL products (already populated with seller in your existing API)
      const prodRes = await fetch('/api/products');
      const allProducts: Product[] = await prodRes.json();
      setProducts(allProducts);

      // Analytics
      const orderRes = await fetch('/api/orders');
      const orders: Order[] = await orderRes.json();

      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: allProducts.length,
        activeSellers: new Set(allProducts.map(p => p.seller?._id).filter(Boolean)).size || 5,
      });
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product permanently from the database?')) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });

      if (res.ok) {
        alert('Product deleted successfully!');
        // Refresh list immediately
        fetchProductsAndAnalytics();
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>👑 CEO / Super Admin Dashboard</h1>
      <p>Full control over the entire operation • Products are deleted from database instantly</p>

      {/* Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3>Total Revenue</h3>
          <h2>${analytics.totalRevenue.toFixed(2)}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3>Total Orders</h3>
          <h2>{analytics.totalOrders}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3>Total Products</h3>
          <h2>{analytics.totalProducts}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3>Active Sellers</h3>
          <h2>{analytics.activeSellers}</h2>
        </div>
      </div>

      {/* All Products Table */}
      <h2>All Products from All Sellers</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th style={{ padding: '15px', textAlign: 'left' }}>Product Name</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Price</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Category</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Seller</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '15px' }}>{product.productName}</td>
              <td style={{ padding: '15px' }}>${product.price}</td>
              <td style={{ padding: '15px' }}>{product.category}</td>
              <td style={{ padding: '15px' }}>{product.seller?.businessName || 'Unknown Seller'}</td>
              <td style={{ padding: '15px', textAlign: 'center' }}>
                <button
                  onClick={() => deleteProduct(product._id)}
                  disabled={deletingId === product._id}
                  style={{
                    background: deletingId === product._id ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    cursor: deletingId === product._id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deletingId === product._id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}