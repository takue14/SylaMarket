'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import ProductModal from './ProductModal';
import SearchBar from './SearchBar';
import Sidebar from './CategorySidebar';
import RecommendedCard from './RecommendedCard';
import { Product } from '@/types/product';
import styles from '@/styles/Home.module.css';
import Loader from './Loader';

interface HomeClientProps {
  initialCategory: string;
  initialProducts: Product[];
  initialPage?: number;
}

export default function HomeClient({ initialCategory, initialProducts, initialPage = 1 }: HomeClientProps) {
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Get customerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem('customerId');
    setCustomerId(id);
  }, []);

  // Skeleton timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load main products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    const queryParams = new URLSearchParams({ category, page: page.toString() });
    if (searchQuery) queryParams.append('search', searchQuery);

    try {
      const res = await fetch(`/api/products?${queryParams}`);
      const data: Product[] = await res.json();
      setProducts(prev => page === 1 ? data : [...prev, ...data]);
      setHasMore(data.length > 0);
    } catch (err) {
      console.error('Load products error:', err);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load ML-based recommendations from Python backend
  const loadRecommendations = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/recommendations?user_id=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setRecommended(data.products);
        }
      }
    } catch (err) {
      console.error('ML recommendations failed:', err);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) loadRecommendations();
  }, [customerId, loadRecommendations]);

  // Log activity for better ML recommendations
  const logActivity = (productId: string, action: string = 'click') => {
    if (!customerId) return;
    fetch('/api/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: customerId, product_id: productId, action }),
    }).catch(() => {});
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPage(1);
    setProducts([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setProducts([]);
  };

  const openModal = (product: Product) => {
    logActivity(product._id, 'click');
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const loadMore = () => {
    if (!loading && hasMore) setPage(prev => prev + 1);
  };

  if (loading && products.length === 0) return <Loader />;

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={styles.hero} >
        <div className={styles.heroContent} >
          <h1>Syla |Spring Into Savings</h1>
          <p>Shop</p>
        </div>
        <div className={styles.searchHero}>
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Recommended Products - Horizontal Scroll */}
      <section style={{ margin: '10px 0' }}>
        <h3 style={{ marginBottom: '5px', paddingLeft: '20px' }}>Recommended For You</h3>
        <div style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: '10px', 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          margin:'10px'
        }}>
          {recommended.length > 0 ? (
            recommended.map((product) => (
              <RecommendedCard 
                key={product._id} 
                product={product} 
                onClick={() => openModal(product)} 
              />
            ))
          ) : (
            <p style={{ paddingLeft: '20px', color: '#666' }}>No recommendations yet. Browse some products!</p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar Categories */}
        <Sidebar selectedCategory={category} onSelectCategory={handleCategoryChange} />

        {/* Product Grid */}
        <main className={styles.productGrid}>
          <div className={styles.grid}>
            {showSkeleton ? (
              <ProductCardSkeleton count={8} />
            ) : (
              products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onClick={() => openModal(product)} 
                />
              ))
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
              <button onClick={loadMore} disabled={loading} style={{ padding: '12px 30px' }}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          isOpen={true} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}