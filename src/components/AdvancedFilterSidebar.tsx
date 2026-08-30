'use client';

import styled from 'styled-components';

interface FilterProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onClearFilters: () => void;
}

const categories = ['Electronics', 'Fashion', 'Home', 'Music', 'Books', 'Sports', 'Beauty'];

export default function AdvancedFilterSidebar({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  setSelectedCategories,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  onClearFilters,
}: FilterProps) {
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  return (
    <FilterContainer>
      <h3>Search & Filter</h3>

      {/* NEW AI-STYLE SEARCH INPUT */}
      <div className="ai-input-container">
        <div className="ai-icon">
          <svg
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            stroke="#5c51e8"
            fill="none"
            viewBox="0 0 24 24"
            height="20"
            width="20"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>

        <input
          placeholder="Search products..."
          className="ai-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button className="send-button" type="button">
          <svg
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
            height="18"
            width="18"
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </button>
      </div>

      {/* Categories with exact gooey checkbox design */}
      <div className="filter-section">
        <h4>Categories</h4>

        {/* Shared SVG filter (goo effect) - rendered once */}
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
          <defs>
            <filter id="goo-12">
              <feGaussianBlur result="blur" stdDeviation="4" in="SourceGraphic"></feGaussianBlur>
              <feColorMatrix result="goo-12" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" mode="matrix" in="blur"></feColorMatrix>
              <feBlend in2="goo-12" in="SourceGraphic"></feBlend>
            </filter>
          </defs>
        </svg>

        <div className="category-list">
          {categories.map((cat, index) => {
            const checkboxId = `cbx-12-${index}`;
            return (
              <div key={cat} className="category-item">
                <div className="checkbox-wrapper-12">
                  <div className="cbx">
                    <input
                      type="checkbox"
                      id={checkboxId}
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <label htmlFor={checkboxId}></label>
                    <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                      <path d="M2 8.36364L6.23077 12L13 2"></path>
                    </svg>
                  </div>
                </div>
                <span className="category-text">{cat}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-slider">
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
          />
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          />
          <div className="price-values">
            ${priceRange[0]} - ${priceRange[1]}
          </div>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="filter-section">
        <h4>Minimum Rating</h4>
        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
          <option value={0}>All Ratings</option>
          <option value={4}>4+ Stars</option>
          <option value={3}>3+ Stars</option>
          <option value={2}>2+ Stars</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="filter-section">
        <h4>Sort By</h4>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Best Rated</option>
        </select>
      </div>

      {/* NEW DELETE BUTTON - Centered & Fully Functional */}
      <div className="clear-button-wrapper">
        <button className="delete-btn" onClick={onClearFilters}>
          <svg viewBox="0 0 448 512" className="svgIcon">
            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
          </svg>
        </button>
      </div>
    </FilterContainer>
  );
}

const FilterContainer = styled.div`
  background: var(--bg-base);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  width: 280px;
  height: fit-content;

  h3 {
    color: var(--text-primary);
    margin-bottom: 20px;
  }

  /* ========== NEW AI-STYLE SEARCH INPUT ========== */
  .ai-input-container {
    display: flex;
    align-items: center;
    background: linear-gradient(145deg, #f0f0f0, #ffffff);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    padding: 6px 8px;
    width: 100%;
    max-width: 100%;
    margin-bottom: 20px;
  }

  .ai-input-container:focus-within {
    box-shadow:
      0 10px 20px rgba(0, 0, 0, 0.15),
      0 0 0 2px rgba(15, 5, 151, 0.4);
  }

  .ai-icon {
    padding: 0 12px 0 8px;
    display: flex;
    align-items: center;
  }

  .ai-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 15px;
    padding: 12px 8px;
    color: #333;
    min-width: 0;
  }

  .send-button {
    border: none;
    border-radius: 12px;
    background: linear-gradient(145deg, #6366f1, #5c51e8);
    color: white;
    padding: 10px 14px;
    cursor: pointer;
    margin-left: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .send-button:hover {
    background: linear-gradient(145deg, #5c51e8, #4c41d8);
    transform: scale(1.05);
  }
  /* ========== END AI SEARCH ========== */

  .filter-section {
    margin-bottom: 25px;
  }

  h4 {
    color: var(--text-primary);
    margin-bottom: 12px;
    font-size: 15px;
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;
  }

  .category-text {
    font-size: 15px;
    color: var(--text-primary);
  }

  /* ========== EXACT GOOEY CHECKBOX DESIGN (preserved) ========== */
  .checkbox-wrapper-12 {
    position: relative;
  }

  .checkbox-wrapper-12 > svg {
    position: absolute;
    top: -130%;
    left: -170%;
    width: 110px;
    pointer-events: none;
  }

  .checkbox-wrapper-12 * {
    box-sizing: border-box;
  }

  .checkbox-wrapper-12 input[type="checkbox"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    margin: 0;
  }

  .checkbox-wrapper-12 input[type="checkbox"]:focus {
    outline: 0;
  }

  .checkbox-wrapper-12 .cbx {
    width: 24px;
    height: 24px;
    position: relative;
    top: 0;
    left: 0;
  }

  .checkbox-wrapper-12 .cbx input {
    position: absolute;
    top: 0;
    left: 0;
    width: 24px;
    height: 24px;
    border: 2px solid #bfbfc0;
    border-radius: 50%;
  }

  .checkbox-wrapper-12 .cbx label {
    width: 24px;
    height: 24px;
    background: none;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    transform: translate3d(0, 0, 0);
    pointer-events: none;
  }

  .checkbox-wrapper-12 .cbx svg {
    position: absolute;
    top: 5px;
    left: 4px;
    z-index: 1;
    pointer-events: none;
  }

  .checkbox-wrapper-12 .cbx svg path {
    stroke: #fff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 19;
    stroke-dashoffset: 19;
    transition: stroke-dashoffset 0.3s ease;
    transition-delay: 0.2s;
  }

  .checkbox-wrapper-12 .cbx input:checked + label {
    animation: splash-12 0.6s ease forwards;
  }

  .checkbox-wrapper-12 .cbx input:checked + label + svg path {
    stroke-dashoffset: 0;
  }

  @-moz-keyframes splash-12 {
    40% {
      background: #866efb;
      box-shadow: 0 -18px 0 -8px #866efb, 16px -8px 0 -8px #866efb, 16px 8px 0 -8px #866efb, 0 18px 0 -8px #866efb, -16px 8px 0 -8px #866efb, -16px -8px 0 -8px #866efb;
    }
    100% {
      background: #866efb;
      box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
    }
  }

  @-webkit-keyframes splash-12 {
    40% {
      background: #866efb;
      box-shadow: 0 -18px 0 -8px #866efb, 16px -8px 0 -8px #866efb, 16px 8px 0 -8px #866efb, 0 18px 0 -8px #866efb, -16px 8px 0 -8px #866efb, -16px -8px 0 -8px #866efb;
    }
    100% {
      background: #866efb;
      box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
    }
  }

  @-o-keyframes splash-12 {
    40% {
      background: #866efb;
      box-shadow: 0 -18px 0 -8px #866efb, 16px -8px 0 -8px #866efb, 16px 8px 0 -8px #866efb, 0 18px 0 -8px #866efb, -16px 8px 0 -8px #866efb, -16px -8px 0 -8px #866efb;
    }
    100% {
      background: #866efb;
      box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
    }
  }

  @keyframes splash-12 {
    40% {
      background: #866efb;
      box-shadow: 0 -18px 0 -8px #866efb, 16px -8px 0 -8px #866efb, 16px 8px 0 -8px #866efb, 0 18px 0 -8px #866efb, -16px 8px 0 -8px #866efb, -16px -8px 0 -8px #866efb;
    }
    100% {
      background: #866efb;
      box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
    }
  }
  /* ========== END GOOEY CHECKBOX ========== */

  .price-slider {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .price-slider input[type="range"] {
    accent-color: #7c3aed;
  }

  .price-values {
    text-align: center;
    font-weight: 600;
    color: #7c3aed;
    margin-top: 4px;
  }

  select {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 2px solid #d8b4fe;
    font-size: 15px;
    outline: none;
  }

  /* ========== NEW DELETE BUTTON (Centered & Animated) ========== */
  .clear-button-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 15px;
    margin-bottom: 5px;
  }

  .delete-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgb(20, 20, 20);
    border: none;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.164);
    cursor: pointer;
    transition-duration: 0.3s;
    overflow: hidden;
    position: relative;
  }

  .delete-btn .svgIcon {
    width: 12px;
    transition-duration: 0.3s;
  }

  .delete-btn .svgIcon path {
    fill: white;
  }

  .delete-btn:hover {
    width: 140px;
    border-radius: 50px;
    transition-duration: 0.3s;
    background-color: rgb(255, 69, 69);
    align-items: center;
  }

  .delete-btn:hover .svgIcon {
    width: 50px;
    transition-duration: 0.3s;
    transform: translateY(60%);
  }

  .delete-btn::before {
    position: absolute;
    top: -20px;
    content: "Delete";
    color: white;
    transition-duration: 0.3s;
    font-size: 2px;
    opacity: 0;
  }

  .delete-btn:hover::before {
    font-size: 13px;
    opacity: 1;
    transform: translateY(30px);
    transition-duration: 0.3s;
  }
  /* ========== END DELETE BUTTON ========== */
`;