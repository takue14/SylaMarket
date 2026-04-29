import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  products: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'inprogress', 'delivered'], 
    default: 'pending' 
  },
  claimedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);