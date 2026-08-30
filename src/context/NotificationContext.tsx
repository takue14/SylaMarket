'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import styled from 'styled-components';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
  confirmAction: (message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [confirmState, setConfirmState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const confirmAction = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <NotificationContext.Provider value={{ notify, confirmAction }}>
      {children}

      <ToastStack>
        {toasts.map((t) => (
          <Toast key={t.id} $type={t.type}>
            <span className="dot" />
            <span className="msg">{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              ×
            </button>
          </Toast>
        ))}
      </ToastStack>

      {confirmState && (
        <ConfirmOverlay onClick={() => handleConfirmResult(false)}>
          <ConfirmCard onClick={(e) => e.stopPropagation()}>
            <p>{confirmState.message}</p>
            <div className="actions">
              <button type="button" className="cancel" onClick={() => handleConfirmResult(false)}>
                Cancel
              </button>
              <button type="button" className="confirm" onClick={() => handleConfirmResult(true)}>
                Confirm
              </button>
            </div>
          </ConfirmCard>
        </ConfirmOverlay>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider');
  return ctx;
};

const TYPE_COLORS: Record<NotificationType, { bg: string; border: string; dot: string }> = {
  success: { bg: 'rgba(20, 140, 90, 0.1)', border: 'rgba(20, 140, 90, 0.3)', dot: '#14804f' },
  error: { bg: 'rgba(200, 30, 30, 0.1)', border: 'rgba(200, 30, 30, 0.3)', dot: '#a12626' },
  warning: { bg: 'rgba(200, 140, 0, 0.1)', border: 'rgba(200, 140, 0, 0.3)', dot: '#a17300' },
  info: { bg: 'rgba(91, 108, 255, 0.1)', border: 'rgba(91, 108, 255, 0.3)', dot: '#5b6cff' },
};

const ToastStack = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 380px;
  padding: 0 12px;
  pointer-events: none;

  @media (max-width: 480px) {
    top: auto;
    bottom: 16px;
  }
`;

const Toast = styled.div<{ $type: NotificationType }>`
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card, #fff);
  border: 1px solid ${(p) => TYPE_COLORS[p.$type].border};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13.5px;
  color: var(--text-primary, #111);
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(p) => TYPE_COLORS[p.$type].dot};
    flex-shrink: 0;
  }
  .msg { flex: 1; line-height: 1.4; }
  button {
    background: none;
    border: none;
    color: var(--text-muted, #888);
    font-size: 16px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ConfirmCard = styled.div`
  background: var(--bg-card, #fff);
  border-radius: 16px;
  padding: 22px;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);

  p {
    margin: 0 0 18px;
    font-size: 14px;
    color: var(--text-primary, #111);
    line-height: 1.5;
  }
  .actions { display: flex; gap: 10px; justify-content: flex-end; }
  button {
    padding: 9px 18px;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }
  .cancel { background: var(--bg-card-deep, #eee); color: var(--text-primary, #111); }
  .confirm { background: #ef4444; color: white; }
`;