import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  image: string;
  description: string;
  specs: string[];
  reviewList: { user: string; rating: number; comment: string }[];
}

export const products: Product[] = [
  {
    id: uuidv4(),
    name: 'Phone Holder Sakti',
    price: 29.90,
    rating: 5.0,
    reviews: 102,
    category: 'For Phone',
    image: '/images/phone-holder.jpg',
    description: 'A sturdy phone holder for hands-free use.',
    specs: ['Material: Plastic', 'Color: Black', 'Compatibility: All phones'],
    reviewList: [{ user: 'John', rating: 5, comment: 'Great product!' }],
  },
  {
    id: uuidv4(),
    name: 'HeadSound',
    price: 12.00,
    rating: 5.0,
    reviews: 1126,
    category: 'For Music',
    image: '/images/headphones.jpg',
    description: 'High-quality headphones for immersive sound.',
    specs: ['Wireless', 'Battery: 20 hours', 'Color: White'],
    reviewList: [{ user: 'Jane', rating: 4, comment: 'Good value.' }],
  },
  {
    id: uuidv4(),
    name: 'Adudu Cleaner',
    price: 289.00,
    rating: 4.4,
    reviews: 115,
    category: 'For Home',
    image: '/images/cleaner.jpg',
    description: 'Smart vacuum cleaner for home use.',
    specs: ['Auto-navigation', 'Battery: 2 hours', 'Color: White'],
    reviewList: [],
  },
  {
    id: uuidv4(),
    name: 'CCTV Maling',
    price: 50.00,
    rating: 4.8,
    reviews: 1202,
    category: 'For Home',
    image: '/images/cctv.jpg',
    description: 'Security camera with night vision.',
    specs: ['Resolution: 1080p', 'Wireless', 'Storage: Cloud'],
    reviewList: [],
  },
  {
    id: uuidv4(),
    name: 'Stuffus Peker 32',
    price: 9.90,
    rating: 5.0,
    reviews: 1026,
    category: 'Other',
    image: '/images/peker.jpg',
    description: 'Compact storage device.',
    specs: ['Capacity: 32GB', 'USB 3.0'],
    reviewList: [],
  },
  {
    id: uuidv4(),
    name: 'Stuffus 175',
    price: 341.00,
    rating: 4.2,
    reviews: 102,
    category: 'Other',
    image: '/images/stuffus175.jpg',
    description: 'Advanced gadget for everyday use.',
    specs: ['Feature-rich', 'Durable'],
    reviewList: [],
  },
  // Add more for pagination/testing
];

export const recommendations: Product[] = [
  // Subset or similar
  {
    id: uuidv4(),
    name: 'TWS Bujug',
    price: 29.90,
    rating: 5.0,
    reviews: 1126,
    category: 'For Music',
    image: '/images/tws-bujug.jpg',
    description: 'True wireless earbuds.',
    specs: ['Bluetooth 5.0', 'Battery: 4 hours'],
    reviewList: [],
  },
  // Add others
];