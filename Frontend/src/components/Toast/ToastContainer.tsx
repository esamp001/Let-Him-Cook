import { useEffect, useState } from 'react';
import type { ToastItem } from '../../types/interfaces/ToastItem';
import type { ToastContainerProps } from '../../types/interfaces/ToastContainerProps';
import { toast } from './toastService';
import { ToastItemView } from './ToastItemView';
import './Toast.css';

export const ToastContainer = ({ className = '' }: ToastContainerProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast._subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container ${className}`.trim()}>
      {toasts.map((item) => (
        <ToastItemView
          key={item.id}
          item={item}
          onDismiss={(id) => toast.dismiss(id)}
        />
      ))}
    </div>
  );
};

