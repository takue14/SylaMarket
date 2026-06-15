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
  quantity: { type: Number, default: 0, min: 0 },   // ← New field for stock
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;