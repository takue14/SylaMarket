import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileBottomBar from '@/components/MobileBottomBar';
import { CartProvider } from '../context/CartContext';
import { ProductProvider } from '@/contexts/ProductContext';
import { NotificationProvider } from '@/context/NotificationContext';

const inter = localFont({
  src: [
    { path: './fonts/Inter-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Inter-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Inter-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
});

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
                <NotificationProvider>
          <CartProvider>
            <ProductProvider>
              <Header />
              <div style={{ paddingTop: 'var(--header-height)' }}>
                {children}
              </div>
              <Footer />
              <MobileBottomBar />
            </ProductProvider>
          </CartProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}