import { Seller } from '@/models/Seller';
import Customer from '@/models/Customer';
import DeliveryGuy from '@/models/DeliveryGuy';

export type AuthRole = 'buyer' | 'seller' | 'delivery';

interface RoleEntry {
  model: any;
  contactField: string;
  idKey: 'customerId' | 'sellerId' | 'deliveryGuyId';
  sessionRole: 'customer' | 'seller' | 'delivery';
}

export const ROLE_REGISTRY: Record<AuthRole, RoleEntry> = {
  buyer: { model: Customer, contactField: 'email', idKey: 'customerId', sessionRole: 'customer' },
  seller: { model: Seller, contactField: 'contact', idKey: 'sellerId', sessionRole: 'seller' },
  delivery: { model: DeliveryGuy, contactField: 'contact', idKey: 'deliveryGuyId', sessionRole: 'delivery' },
};