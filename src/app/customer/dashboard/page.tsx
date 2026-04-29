'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = () => {
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      router.push('/customer/login');
      return;
    }

    fetch(`/api/orders?customerId=${customerId}`)
      .then(res => res.json())
      .then((data: Order[]) => {
        setOrders(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) return <p>Loading your order history...</p>;

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>My Order History</h1>

      {orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={{ border: '1px solid #ddd', padding: '20px', margin: '15px 0', borderRadius: '8px' }}>
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Total:</strong> ${order.totalAmount}</p>
            <p><strong>Status:</strong> 
              <span style={{ color: order.status === 'Delivered' ? 'green' : order.status === 'InProgress' ? 'orange' : 'red' }}>
                {order.status}
              </span>
            </p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>

            <h4>Items Ordered:</h4>
            <ul>
              {order.products.map((item, index) => (
                <li key={index}>
                  {item.productName} × {item.quantity} (${item.price})
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}