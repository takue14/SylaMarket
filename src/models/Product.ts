import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
    description: { type: String },
  imageLink: { type: String }, // kept for backward compatibility — always mirrors images[0]
  images: {
    type: [String],
    validate: {
      validator: (arr: string[]) => arr.length >= 1 && arr.length <= 4,
      message: 'A product must have between 1 and 4 images.',
    },
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
    quantity: { type: Number, default: 0, min: 0 },
  salePrice: { type: Number, default: null }, // null = no active discount
  paymentMethods: {
    type: [String],
    enum: ['cod', 'ecocash', 'paynow'],
    default: ['cod', 'ecocash', 'paynow'], // existing products default to accepting everything
  },
  lowStockThreshold: { type: Number, default: 5 },
  segment: { type: String, enum: ['dealo', 'dealo-fresh'], default: 'dealo' }, // NEW
  createdAt: { type: Date, default: Date.now },
  country: { type: String, required: true },
location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
},
  depositPercentage: { type: Number, default: null, min: 1, max: 99 }, // null = split payment not offered on this product
});
productSchema.index({ location: '2dsphere' });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;