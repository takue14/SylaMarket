import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  adTitle: { type: String, required: true },
  adDescription: { type: String },
  customerName: { type: String, required: true },
  contact: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
export default Inquiry;