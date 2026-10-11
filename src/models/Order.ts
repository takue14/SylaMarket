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
    deliveryCodeExpiresAt: { type: Date, default: null },
  deliveryCodeAttempts: { type: Number, default: 0 },
  deliveryCodeLockedUntil: { type: Date, default: null },
    itemStatus: {
    type: String,
    enum: ['awaiting_seller', 'accepted', 'preparing', 'ready', 'shipped', 'at_hub'],
    default: 'awaiting_seller',
  },
  deliveryContribution: { type: Number, default: 0 }, // per-line total embedded in price
  commission: { type: Number, default: 0 },
  sellerPayout: { type: Number, default: 0 },

    
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
    deliveryCodeExpiresAt: { type: Date, default: null },
  deliveryCodeAttempts: { type: Number, default: 0 },
  deliveryCodeLockedUntil: { type: Date, default: null },
    fulfillment: {
    type: String,
    enum: [
      'order_created', 'payment_pending', 'payment_confirmed', 'seller_accepted', 'seller_preparing',
      'ready_for_collection', 'collected', 'at_hub', 'sorted', 'assigned_to_route',
      'out_for_delivery', 'delivered', 'settled',
    ],
    default: 'order_created',
  },
  fulfillmentMode: { type: String, enum: ['direct', 'hub'], default: 'hub' },
  deliveryReady: { type: Boolean, default: false, index: true },
  deliveryFee: { type: Number, default: 0 },
  driverPay: { type: Number, default: null },
  statusHistory: [
    {
      from: String,
      to: String,
      actorRole: String,
      actorId: String,
      note: String,
      at: { type: Date, default: Date.now },
      _id: false,
    },
  ],
});

OrderSchema.index({ 'products.seller': 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ claimedBy: 1 });
OrderSchema.index({ country: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);