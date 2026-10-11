const r2 = (n: number) => Math.round(n * 100) / 100;

export interface PricedLine { price: number; quantity: number; deliveryContribution: number }
export interface PricingSettings {
  commissionRate: number;
  customerDeliveryFee: number;
  instantBaseFee: number;
  instantPerItemFee: number;
}

export function priceOrder(lines: PricedLine[], s: PricingSettings, mode: 'hub' | 'instant') {
  const items = lines.map((l) => {
    const gross = l.price * l.quantity;
    const contribution = r2(Math.min(l.deliveryContribution * l.quantity, gross));
    const commission = r2(gross * s.commissionRate);
    return { gross, contribution, commission, sellerPayout: r2(gross - commission - contribution) };
  });
  const units = lines.reduce((a, l) => a + l.quantity, 0);
  const itemsTotal = r2(items.reduce((a, i) => a + i.gross, 0));
  const deliveryFee = r2(mode === 'instant' ? s.instantBaseFee + s.instantPerItemFee * units : s.customerDeliveryFee);
  return {
    items,
    itemsTotal,
    deliveryFee,
    total: r2(itemsTotal + deliveryFee),
    driverPay: r2(items.reduce((a, i) => a + i.contribution, 0) + deliveryFee),
  };
}