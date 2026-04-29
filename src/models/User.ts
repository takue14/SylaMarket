// src/models/User.ts (ensure this file exists)
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
});

export const UserModel = mongoose.models.users || mongoose.model('users', userSchema);