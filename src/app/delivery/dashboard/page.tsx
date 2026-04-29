'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerName: string;
  contact: string;
  location: string;
  products: OrderItem[];
  status: 'pending' | 'inprogress' | 'delivered';
  claimedBy?: string | null;
  totalAmount: number;
  createdAt: string;
}

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryGuyId, setDeliveryGuyId] = useState<string | null>(null);
  const [dailyDeliveredData, setDailyDeliveredData] = useState<ChartData<'line'> | null>(null);
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    const id = localStorage.getItem('deliveryGuyId');
    if (!id) return router.push('/delivery/login');
    setDeliveryGuyId(id);

    const res = await fetch('/api/orders');
    let allOrders: Order[] = await res.json();

    const now = new Date();
    allOrders = allOrders.map((order) => {
      const orderDate = new Date(order.createdAt);
      const hoursOld = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

      if (hoursOld > 24 && order.status !== 'delivered') {
        return { ...order, status: 'pending' as const, claimedBy: null };
      }
      return order;
    });

    const visible = allOrders.filter(
      (o) => o.status === 'pending' || o.claimedBy === id
    );

    setOrders(visible);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const delivered = allOrders.filter((o) => o.status === 'delivered');
    const dailyRevenue = last7Days.map((date) => {
      const dayOrders = delivered.filter((o) => o.createdAt.startsWith(date));
      return dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    });

    setDailyDeliveredData({
      labels: last7Days,
      datasets: [{
        label: 'Daily Delivered Revenue ($)',
        data: dailyRevenue,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
      }],
    });
  }, [router]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const claimOrder = async (orderId: string) => {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'inprogress', deliveryGuyId }),
    });
    fetchOrders();
  };

  const updateStatus = async (orderId: string, newStatus: 'inprogress' | 'delivered' | 'pending') => {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus, deliveryGuyId }),
    });
    fetchOrders();
  };

  return (
    <StyledWrapper>
      <div className="master-container">

        <div className="card">
          <label className="title">🚚 Delivery Dashboard</label>
          <div className="content">
            <p>Driver ID: {deliveryGuyId}</p>
          </div>
        </div>

        {/* Graph Card */}
        <div className="card">
          <label className="title">Revenue Analytics</label>
          <div className="content">
            {dailyDeliveredData && <Line data={dailyDeliveredData} />}
          </div>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="card">
            <label className="title">Orders</label>
            <div className="content">
              <p>No orders available right now.</p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card">
              <label className="title">Order #{order._id.slice(-6)}</label>

              <div className="content">
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Contact:</strong> {order.contact}</p>
                <p><strong>Location:</strong> {order.location}</p>

                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status ${order.status}`}>
                    {order.status.toUpperCase()}
                  </span>
                </p>

                <div className="items">
                  {order.products.map((item, i) => (
                    <p key={i}>
                      {item.productName} × {item.quantity} — ${item.price}
                    </p>
                  ))}
                </div>

                <p><strong>Total:</strong> ${order.totalAmount}</p>

                <div className="actions">
                  {order.status === 'pending' && (
                    <button onClick={() => claimOrder(order._id)}>
                      Claim Order
                    </button>
                  )}

                  {order.claimedBy === deliveryGuyId && order.status === 'inprogress' && (
                    <button onClick={() => updateStatus(order._id, 'delivered')}>
                      Mark Delivered
                    </button>
                  )}

                  {order.claimedBy === deliveryGuyId && order.status === 'delivered' && (
                    <button className="danger" onClick={() => updateStatus(order._id, 'pending')}>
                      Return to Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .master-container {
    display: grid;
    gap: 20px;
    padding: 20px;
    justify-content: center;
  }

  .card {
    width: 500px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.08);
  }

  .title {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 20px;
    border-bottom: 1px solid #efeff3;
    font-weight: 700;
    font-size: 12px;
    color: #63656b;
  }

  .content {
    padding: 15px;
  }

  .items {
    margin: 10px 0;
    font-size: 13px;
    color: #555;
  }

  .status {
    font-weight: 700;
  }

  .status.pending {
    color: #3b82f6;
  }

  .status.inprogress {
    color: #f59e0b;
  }

  .status.delivered {
    color: #10b981;
  }

  .actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .actions button {
    background: linear-gradient(180deg, #4480ff 0%, #115dfc 50%, #0550ed 100%);
    border: none;
    color: white;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .actions button.danger {
    background: #ef4444;
  }
`;