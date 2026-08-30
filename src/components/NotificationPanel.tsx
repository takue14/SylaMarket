'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  asRole: 'buyer' | 'seller' | 'delivery' | 'admin';
}

export default function NotificationPanel({ asRole }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = async () => {
    try {
      const res = await fetch(`/api/notifications?as=${asRole}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // fail silently — notifications are non-critical
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [asRole]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      await fetch(`/api/notifications/${item._id}/read?as=${asRole}`, { method: 'POST' }).catch(() => {});
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  };

  return (
    <Wrapper ref={panelRef}>
      <button className="bell" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="panel">
          <div className="panel-header">Notifications</div>
          {items.length === 0 ? (
            <div className="empty">No notifications yet.</div>
          ) : (
            <div className="list">
              {items.map((item) => (
                <div
                  key={item._id}
                  className={`item${item.read ? '' : ' unread'}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="item-title">{item.title}</div>
                  <div className="item-message">{item.message}</div>
                  <div className="item-time">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;

  .bell {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
    position: relative;
    display: flex;
    align-items: center;
    padding: 6px;
  }

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
  }

  .panel {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--bg-card, #fff);
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 14px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
    z-index: 1000;

    @media (max-width: 480px) {
      position: fixed;
      top: var(--header-height, 70px);
      right: 8px;
      left: 8px;
      width: auto;
    }
  }

  .panel-header {
    padding: 12px 16px;
    font-weight: 700;
    font-size: 14px;
    border-bottom: 1px solid var(--border, #eee);
    color: var(--text-primary);
  }

  .empty {
    padding: 24px 16px;
    text-align: center;
    color: var(--text-muted, #888);
    font-size: 13px;
  }

  .item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border, #f0f0f0);
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--bg-card-deep, #f7f7f7);
    }

    &.unread {
      background: rgba(91, 108, 255, 0.06);
    }

    &.unread .item-title::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #5b6cff;
      margin-right: 6px;
    }
  }

  .item-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 3px;
  }

  .item-message {
    font-size: 12.5px;
    color: var(--text-muted, #666);
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .item-time {
    font-size: 10.5px;
    color: var(--text-dim, #999);
  }
`;