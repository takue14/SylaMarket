// src/types/product.ts (updated to include imageLink)
export interface Product {
  _id: string;
  productName: string;
  price: number;
  category: string;
  description?: string;
    imageLink?: string;
  images?: string[];
  segment?: 'dealo' | 'dealo-fresh';
    paymentMethods?: string[];
  depositPercentage?: number | null;
  seller: {
    _id: string;
    businessName: string;
    name: string;
    contact: string;
  };
  createdAt: Date;
  salePrice?: number;  lowStockThreshold?: number;
}