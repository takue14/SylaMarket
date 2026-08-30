// models/User2.ts
import mongoose from 'mongoose';

const userSchema2 = new mongoose.Schema({
  name: String,
  dob: Number,
  age: Number,
});

export const UserModel2 = mongoose.models.user || mongoose.model('user', userSchema2);