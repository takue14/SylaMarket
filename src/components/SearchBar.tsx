'use client';

import { Dispatch, SetStateAction } from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

export default function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  return (
    <div style={{ marginBottom: '30px', position: 'relative' }}>
      <input
        type="text"
        placeholder="Search products by name or description..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '16px 20px',
          fontSize: '1.1rem',
          borderRadius: '12px',
          border: '2px solid #e2e8f0',
          outline: 'none',
          transition: 'all 0.3s',
        }}
      />
    </div>
  );
}