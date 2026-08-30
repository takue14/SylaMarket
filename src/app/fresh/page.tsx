'use client';

import HomeClient from '@/components/HomeClient';

export default function FreshPage() {
  return (
    <HomeClient
      initialCategory="all"
      initialProducts={[]}
      segment="dealo-fresh"
    />
  );
}