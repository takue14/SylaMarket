import Order from '@/models/Order';

export const FLOW = [
  'order_created', 'payment_pending', 'payment_confirmed', 'seller_accepted', 'seller_preparing',
  'ready_for_collection', 'collected', 'at_hub', 'sorted', 'assigned_to_route',
  'out_for_delivery', 'delivered', 'settled',
] as const;
export type Fulfillment = (typeof FLOW)[number];

export interface Actor { role: 'customer' | 'seller' | 'delivery' | 'admin' | 'system'; id: string }

/**
 * Forward-only move. The update is conditional on the fulfillment value we
 * just read, so two racing requests can't both record the same transition.
 * History is only ever $pushed, never edited.
 */
export async function advanceFulfillment(
  orderId: string,
  to: Fulfillment,
  actor: Actor,
  note = '',
  extraSet: Record<string, unknown> = {}
) {
  const cur = await Order.findById(orderId).select('fulfillment');
  if (!cur) return null;
  const from = cur.fulfillment as Fulfillment;
  if (FLOW.indexOf(to) <= FLOW.indexOf(from)) return null;

  return Order.findOneAndUpdate(
    { _id: orderId, fulfillment: from },
    {
      $set: { fulfillment: to, ...extraSet },
      $push: { statusHistory: { from, to, actorRole: actor.role, actorId: actor.id, note, at: new Date() } },
    },
    { new: true }
  );
}

const ITEM_ORDER = ['awaiting_seller', 'accepted', 'preparing', 'ready', 'shipped', 'at_hub'];
const ITEM_TO_ORDER: Fulfillment[] = [
  'payment_confirmed', 'seller_accepted', 'seller_preparing', 'ready_for_collection', 'collected', 'at_hub',
];

/** Derives the order-level stage from its least-advanced item. */
export async function syncFulfillment(orderId: string, actor: Actor) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  const minIdx = Math.min(...order.products.map((p: { itemStatus: string }) => ITEM_ORDER.indexOf(p.itemStatus)));
  const target = ITEM_TO_ORDER[minIdx];
  if (!target) return order;

  // Direct delivery: drivers can take the order as soon as every item is ready.
  const extra = order.fulfillmentMode === 'direct' && target === 'ready_for_collection' ? { deliveryReady: true } : {};
  return (await advanceFulfillment(orderId, target, actor, '', extra)) ?? order;
}