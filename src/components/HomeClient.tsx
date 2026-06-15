'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import ProductModal from './ProductModal';
import AdvancedFilterSidebar from './AdvancedFilterSidebar';
import RecommendedCard from './RecommendedCard';
import HorizontalCard from './HorizontalCard';
import Ads from './Ads';
import Notfound from '../../src/app/not-found';
import Loader from './Loader';

import {
  FaHome,
  FaShoppingCart,
  FaUser,
  FaSearch,
} from 'react-icons/fa';

import { Product } from '@/types/product';
import styles from '@/styles/Home.module.css';
import styled from 'styled-components';

interface AdItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText: string;
  badge?: string;
  badgeColor?: string;
  isLarge?: boolean;
}

interface RawAd {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText?: string;
  badge?: string;
  badgeColor?: string;
  isLarge?: boolean;
}

interface HomeClientProps {
  initialCategory: string;
  initialProducts: Product[];
}

/* =========================
   HERO BANNER
========================= */

const HeroBanner = styled.div`
  width: 95%;
  max-width: 1500px;
  height: 220px;
  margin: 0 auto 25px auto;
  border-radius: 20px;

  background:
    linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)),
    url('/finalback4.jpg') center/cover no-repeat;

  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 94%;
    height: 170px;
    border-radius: 18px;
    margin-bottom: 18px;
  }

  @media (max-width: 480px) {
    height: 145px;
  }
`;

const BannerText = styled.div`
  text-align: center;
  color: white;
  max-width: 85%;
  z-index: 2;
`;

const BannerSubtitle = styled.p`
  font-size: 1.20rem;
  font-weight: 400;
  opacity: 0.95;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);

  @media (max-width: 768px) {
    font-size: 0.92rem;
    padding: 0 10px;
  }
`;

/* =========================
   CATEGORY GRID
========================= */

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 30px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 20px;
  }
`;

const StyledWrapper = styled.div`
  .btn {
    width: 120px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: none;
    position: relative;
    background-color: transparent;
    transition: .2s cubic-bezier(0.19, 1, 0.22, 1);
    opacity: 0.6;
    justify-self: center;
    color: var(--text-primary);
  }

  .btn::after {
    content: '';
    border-bottom: 3px double rgb(190, 113, 214);
    width: 0;
    height: 100%;
    position: absolute;
    margin-top: -5px;
    top: 0;
    left: 5px;
    visibility: hidden;
    opacity: 1;
    transition: .2s linear;
  }

  .btn .icon {
    transform: translateX(0%);
    transition: .2s linear;
    animation: attention 1.2s linear infinite;
  }

  .btn:hover::after {
    visibility: visible;
    opacity: 0.7;
    width: 90%;
  }

  .btn:hover {
    letter-spacing: 2px;
    opacity: 1;
  }

  .btn:hover > .icon {
    transform: translateX(30%);
    animation: none;
  }

  @keyframes attention {
    0%  { transform: translateX(0%); }
    50% { transform: translateX(30%); }
  }
`;

const CategoryCard = styled.div<{ headerColor: string }>`
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.3s;
  min-height: 340px;

  &:hover {
    transform: translateY(-4px);
  }

  .category-header {
    background: ${props => props.headerColor};
    color: white;
    padding: 15px;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const greyColors = [
  '#64748b',
  '#9ca3af',
  '#6b7280',
  '#374151',
  '#4b5563',
];

/* =========================
   FILTER SIDEBAR
========================= */

const FloatingSidebar = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;

  width: 280px;
  background: var(--bg-card);
  box-shadow: 10px 0 30px rgba(0,0,0,0.25);

  transform: ${props =>
    props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};

  transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);

  z-index: 9999;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: fit-content;
    max-width: 320px;
  }
`;

const Backdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  background: rgba(0,0,0,0.5);

  z-index: 9998;

  opacity: ${props => (props.isOpen ? 1 : 0)};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};

  transition: all 0.4s ease;
`;

/* =========================
   COMPONENT
========================= */

export default function HomeClient({
  initialCategory,
  initialProducts,
}: HomeClientProps) {

  const [cardsPerRow, setCardsPerRow] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 24;
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('shop');

  /* =========================
     EFFECTS
  ========================= */

  useEffect(() => {
    const id = localStorage.getItem('customerId');
    setCustomerId(id);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleToggleFilter = () => setIsFilterOpen(prev => !prev);
    window.addEventListener('toggleFilter', handleToggleFilter);
    return () => window.removeEventListener('toggleFilter', handleToggleFilter);
  }, []);

  /* =========================
     RESPONSIVE GRID
  ========================= */

  useEffect(() => {
    const updateCardsPerRow = () => {
      const width = window.innerWidth;
      if (width >= 1400)      setCardsPerRow(5);
      else if (width >= 1100) setCardsPerRow(4);
      else if (width >= 768)  setCardsPerRow(3);
      else if (width >= 500)  setCardsPerRow(2);
      else                    setCardsPerRow(1);
    };
    updateCardsPerRow();
    window.addEventListener('resize', updateCardsPerRow);
    return () => window.removeEventListener('resize', updateCardsPerRow);
  }, []);

  /* =========================
     PRODUCTS
  ========================= */

  const loadProducts = async (pageNum: number) => {
    setLoading(true);
    const res = await fetch(`/api/products?page=${pageNum}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(prev => [...prev, ...data]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (products.length === 0) loadProducts(1);
  }, []);

  /* =========================
     RECOMMENDATIONS
  ========================= */

  const loadRecommendations = async () => {
    if (!customerId) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/recommendations?user_id=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products?.length > 0) {
          setRecommended(data.products);
          return;
        }
      }
    } catch (err) {}
    const random = [...products].sort(() => 0.5 - Math.random()).slice(0, 8);
    setRecommended(random);
  };

  useEffect(() => {
    loadRecommendations();
  }, [customerId, products]);

  /* =========================
     ADS
  ========================= */

  const loadAds = async () => {
    try {
      const res = await fetch('/api/ads');
      if (res.ok) {
        const data: RawAd[] = await res.json();
        const mappedAds: AdItem[] = data.map((ad: RawAd) => ({
          id: ad._id,
          title: ad.title,
          subtitle: ad.subtitle,
          description: ad.description,
          image: ad.image,
          buttonText: ad.buttonText || 'Shop Now',
          badge: ad.badge,
          badgeColor: ad.badgeColor,
          isLarge: ad.isLarge,
        }));
        setAds(mappedAds);
      }
    } catch (err) {}
  };

  useEffect(() => { loadAds(); }, []);

  /* =========================
     FILTER PRODUCTS
  ========================= */

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p => p.productName.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === 'price-low')       filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return filtered;
  }, [products, searchQuery, selectedCategories, priceRange, sortBy]);

  /* =========================
     HORIZONTAL PRODUCTS
  ========================= */

  const horizontalProducts = useMemo(() => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const diverse: Product[] = [];
    const seenCategories = new Set<string>();
    for (const p of shuffled) {
      if (!seenCategories.has(p.category) && diverse.length < 15) {
        diverse.push(p);
        seenCategories.add(p.category);
      }
    }
    return diverse.length > 0 ? diverse : shuffled.slice(0, 15);
  }, [products]);

  /* =========================
     FUNCTIONS
  ========================= */

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setMinRating(0);
    setSortBy('newest');
  };

  const openModal = (product: Product) => setSelectedProduct(product);
  const closeModal = () => setSelectedProduct(null);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage);
  };

  const randomCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [products]);

  const horizontalInsertIndex = 24;

  /* =========================
     RETURN
  ========================= */

  return (
    <div className={styles.homeContainer}>

      {/* HERO */}
      <HeroBanner>
        <BannerText>
          <img src="/dealowhite.png" width={150} height={150} alt="Logo" />
          <BannerSubtitle>From trusted sellers across the platform</BannerSubtitle>
        </BannerText>
      </HeroBanner>

      {/* RECOMMENDED */}
      <div style={{ marginBottom: '40px', maxWidth: '1500px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '15px', color: 'var(--text-primary)', paddingLeft: '10px' }}>
          Recommended For You
        </h2>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
          {recommended.map(product => (
            <RecommendedCard key={product._id} product={product} onClick={() => openModal(product)} />
          ))}
        </div>
      </div>

      {/* ADS */}
      <div style={{ marginBottom: '40px', maxWidth: '1500px', margin: '10 auto' }}>
        <Ads ads={ads} />
      </div>

      {/* MAIN */}
      <div className={styles.mainContent}>
        <main className={styles.productGrid}>
          <div className={styles.grid}>

            {showSkeleton || loading ? (
              <Loader />
            ) : filteredProducts.length === 0 ? (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 20px' }}>
                <Notfound />
              </p>
            ) : (
              filteredProducts.slice(0, page * limit).map((product, index) => (
                <Fragment key={product._id}>
                  <ProductCard product={product} onClick={() => openModal(product)} />

                  {(index + 1) % horizontalInsertIndex === 0 && (
                    <div style={{ gridColumn: '1 / -1', width: '100%', margin: '0' }}>
                      <h3 style={{ marginBottom: '7px', color: 'var(--text-primary)' }}>
                        You May Also Like
                      </h3>
                      <div style={{ width: '100vw', display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {horizontalProducts.map(hProduct => (
                          <HorizontalCard
                            key={hProduct._id}
                            image={hProduct.imageLink || 'https://via.placeholder.com/280'}
                            title={hProduct.productName}
                            tags={[hProduct.category]}
                            time={hProduct.price}
                            onClick={() => openModal(hProduct)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Fragment>
              ))
            )}

          </div>

          {/* LOAD MORE */}
          <div style={{ gridColumn: '1 / -1', width: '100%', display: 'flex', justifyContent: 'center', margin: '50px 0' }}>
            <StyledWrapper>
              <button className="btn" onClick={loadMore} disabled={loading}>
                See more
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="15px" width="15px" className="icon">
                  <path strokeLinejoin="round" strokeLinecap="round" strokeMiterlimit={10} strokeWidth="1.5" stroke="var(--text-dim)" d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008" />
                </svg>
              </button>
            </StyledWrapper>
          </div>

        </main>
      </div>

      {/* CATEGORIES */}
      <div style={{ marginTop: '0px', maxWidth: '1500px', margin: 'auto' }}>
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
          Discover by Category
        </h2>

        <CategoryGrid className="category-mobile-grid">
          {randomCategories.map(category => {
            const categoryProducts = products
              .filter(p => p.category === category)
              .sort(() => 0.5 - Math.random())
              .slice(0, 4);

            const randomColor = greyColors[Math.floor(Math.random() * greyColors.length)];

            return (
              <CategoryCard key={category} headerColor={randomColor}>
                <div className="category-header">{category}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '12px' }}>
                  {categoryProducts.map(product => (
                    <RecommendedCard key={product._id} product={product} onClick={() => openModal(product)} />
                  ))}
                </div>
              </CategoryCard>
            );
          })}
        </CategoryGrid>
      </div>

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} isOpen={true} onClose={closeModal} />
      )}

      {/* FILTER SIDEBAR */}
      <FloatingSidebar isOpen={isFilterOpen}>
        <AdvancedFilterSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          minRating={minRating}
          setMinRating={setMinRating}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onClearFilters={clearAllFilters}
        />
      </FloatingSidebar>

      {/* BACKDROP */}
      <Backdrop isOpen={isFilterOpen} onClick={() => setIsFilterOpen(false)} />

      {/* RESPONSIVE CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          .${styles.homeContainer} { padding-bottom: 110px; }
          .${styles.mainContent}   { padding: 0 6px; }
          .${styles.grid} {
            display: grid;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            align-items: stretch;
          }
          .${styles.productGrid}     { width: 100%; }
          .category-mobile-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
        }

        @media (max-width: 480px) {
          .${styles.grid} {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
          .category-mobile-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
        }
      `}</style>

    </div>
  );
}