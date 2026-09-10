import webpush from 'web-push';
import { connectToDB } from './mongoose';
import PushSubscription from '@/models/PushSubscription';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  await connectToDB();
  const subs = await PushSubscription.find({ userId });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 410 Gone means the browser unsubscribed — clean up stale entries
        if (err.statusCode === 410) await sub.deleteOne();
        else console.error('Push send failed:', err.message);
      }
    })
  );
}