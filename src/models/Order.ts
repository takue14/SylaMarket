import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
    feeFlaggedForReview: { type: Boolean, default: false },
  feeFlagReason: { type: String, default: null },
    deliveryCodeHash: { type: String, default: null },
  deliveryCodeVerified: { type: Boolean, default: false },

    
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
    paymentReference: { type: String, default: null, index: true }, // merchant-generated reference, exact-matched by the webhook
  pollUrl: { type: String, default: null }, // Paynow's poll URL, used only for status polling
  
  isSplitPayment: { type: Boolean, default: false },
  depositAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
    deliveryCoords: {
    lat: { type: Number, default: null, min: -90, max: 90 },
    lng: { type: Number, default: null, min: -180, max: 180 },
  },
    balanceCollected: { type: Boolean, default: false },
  balanceCollectedAt: { type: Date, default: null },
  estimatedMinutes: { type: Number, default: null },
    driverFee: { type: Number, default: null },        // locked in when a driver claims the order
  driverDistanceKm: { type: Number, default: null },
    feeFlaggedForReview: { type: Boolean, default: false },
  feeFlagReason: { type: String, default: null },
    deliveryCodeHash: { type: String, default: null },
  deliveryCodeVerified: { type: Boolean, default: false },
});

OrderSchema.index({ 'products.seller': 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ claimedBy: 1 });
OrderSchema.index({ country: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);