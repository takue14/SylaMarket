import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },

    
});

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  country: { type: String, default: null },
  products: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'inprogress', 'delivered', 'cancelled'],
    default: 'pending',
  },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryGuy', default: null },
  createdAt: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cod', 'ecocash', 'paynow'], required: true },
  paymentStatus: {
    type: String,
    enum: ['cod_pending', 'awaiting_payment', 'paid', 'failed', 'deposit_paid'],
    required: true,
  },
  paymentReference: { type: String, default: null },
  isSplitPayment: { type: Boolean, default: false },
  depositAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  deliveryCoords: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
    balanceCollected: { type: Boolean, default: false },
  balanceCollectedAt: { type: Date, default: null },
  estimatedMinutes: { type: Number, default: null }
});

OrderSchema.index({ 'products.seller': 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ claimedBy: 1 });
OrderSchema.index({ country: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);