import { connectToDB } from './mongoose';
import Notification, { NotificationRole } from '@/models/Notification';

interface CreateNotificationInput {
  userId: string;
  role: NotificationRole;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  await connectToDB();
  await Notification.create(input);
}