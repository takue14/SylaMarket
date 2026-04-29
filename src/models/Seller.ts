// models/Seller.ts
import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },            // person’s name
  businessName: { type: String, required: true },    // company name
  contact: { type: String, required: true },         // email or phone
  password: { type: String, required: true },        // store hashed
  createdAt: { type: Date, default: Date.now }
});

export const Seller = mongoose.models.Seller || mongoose.model('Seller', sellerSchema);