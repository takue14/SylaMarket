import { getTransporter } from './mailer';

interface ReceiptOrder {
  _id: string;
  customerName: string;
  contact: string;
  location: string;
  products: Array<{ productName: string; quantity: number; price: number }>;
  totalAmount: number;
  paymentMethod: 'cod' | 'ecocash' | 'paynow';
}

export async function sendReceiptEmail(toEmail: string, order: ReceiptOrder) {
  const isPaid = order.paymentMethod !== 'cod';
  const subject = isPaid ? `Receipt — Order #${order._id.slice(-6)}` : `Order confirmed — #${order._id.slice(-6)}`;

  const itemsHtml = order.products
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;">${item.productName} × ${item.quantity}</td><td style="text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2>${isPaid ? 'Payment received' : 'Order confirmed'}</h2>
      <p>Order #${order._id.slice(-6)}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${itemsHtml}
        <tr><td style="padding-top:10px;font-weight:bold;">Total</td><td style="text-align:right;padding-top:10px;font-weight:bold;">$${order.totalAmount.toFixed(2)}</td></tr>
      </table>
      <p><strong>Delivery to:</strong> ${order.location}</p>
      <p><strong>Payment method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'ecocash' ? 'EcoCash' : 'Card/Bank (Paynow)'}</p>
      ${!isPaid ? '<p>Please have the exact amount ready for the delivery driver.</p>' : ''}
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'Dealo <no-reply@dealo.com>',
    to: toEmail,
    subject,
    html,
  });
}