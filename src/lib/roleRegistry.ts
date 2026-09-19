import { Seller } from '@/models/Seller';
import Customer from '@/models/Customer';
import DeliveryGuy from '@/models/DeliveryGuy';

export type AuthRole = 'buyer' | 'seller' | 'delivery';

interface RoleLookupModel {
  findById: (id: string) => Promise<{ _id: { toString: () => string }; verificationStatus?: string } | null>;
}

interface RoleEntry {
  model: RoleLookupModel;
  contactField: string;
  idKey: 'customerId' | 'sellerId' | 'deliveryGuyId';
  sessionRole: 'customer' | 'seller' | 'delivery';
}

export const ROLE_REGISTRY: Record<AuthRole, RoleEntry> = {
  buyer: {
    model: Customer as unknown as RoleLookupModel,
    contactField: 'email',
    idKey: 'customerId',
    sessionRole: 'customer',
  },
  seller: {
    model: Seller as unknown as RoleLookupModel,
    contactField: 'contact',
    idKey: 'sellerId',
    sessionRole: 'seller',
  },
  delivery: {
    model: DeliveryGuy as unknown as RoleLookupModel,
    contactField: 'contact',
    idKey: 'deliveryGuyId',
    sessionRole: 'delivery',
  },
};