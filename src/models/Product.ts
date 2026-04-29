import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  imageLink: { type: String },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seller', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

// This line is critical for Next.js App Router + Turbopack
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;