import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },

      status: {
    type: String,
    enum: ['pending', 'inprogress', 'delivered', 'cancelled'],
    default: 'pending',
  },
    paymentMethod: { type: String, enum: ['cod', 'ecocash', 'paynow'], required: true },
  paymentStatus: {
    type: String,
    enum: ['cod_pending', 'awaiting_payment', 'paid', 'failed'],
    required: true,
  },
  paymentReference: { type: String, default: null }, // Paynow's poll URL, used to check status
});

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  country: { type: String, default: null }, // geocoded from `location` at checkout time
  products: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
    status: {
    type: String,
    enum: ['pending', 'inprogress', 'delivered', 'cancelled'],
    default: 'pending',
  },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryGuy', default: null },
  createdAt: { type: Date, default: Date.now },
});

OrderSchema.index({ 'products.seller': 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ claimedBy: 1 });
OrderSchema.index({ country: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);