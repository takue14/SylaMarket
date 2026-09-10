import { connectToDB } from './mongoose';
import Activity, { ActivityType } from '@/models/Activity';

interface LogActivityInput {
  customerId: string;
  type: ActivityType;
  product?: { _id: string; productName: string; imageLink?: string };
}

export async function logActivity({ customerId, type, product }: LogActivityInput) {
  try {
    await connectToDB();
    await Activity.create({
      customer: customerId,
      type,
      product: product?._id,
      productName: product?.productName,
      productImage: product?.imageLink,
    });
  } catch (err) {
    console.error('logActivity failed (non-fatal):', err);
  }
}