import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileBottomBar from '@/components/MobileBottomBar';
import { CartProvider } from '../context/CartContext';
import { ProductProvider } from '@/contexts/ProductContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dealo',
  description: 'Give All You Need',
  metadataBase: new URL('https://stuffus.com'),
  openGraph: {
    title: 'Dealo',
    description: 'E-commerce for home, music, and more.',
    images: '/images/banner.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <ProductProvider>
            <Header />
            {children}
            <Footer />
            <MobileBottomBar />
          </ProductProvider>
        </CartProvider>
      </body>
    </html>
  );
}