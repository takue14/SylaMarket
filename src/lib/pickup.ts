import { Seller } from '@/models/Seller';

/** Seller details for the driver — call ONLY for a driver who has claimed an instant order. */
export async function getPickupDetails(products: { seller: { toString: () => string } }[]) {
  const ids = [...new Set(products.map((p) => p.seller.toString()))];
  const sellers = await Seller.find({ _id: { $in: ids } }).select('businessName name contact location');
  return sellers.map((s) => ({
    sellerId: s._id.toString(),
    name: s.businessName || s.name,
    contact: s.contact,
    lat: s.location?.coordinates?.[1] ?? null,
    lng: s.location?.coordinates?.[0] ?? null,
  }));
}