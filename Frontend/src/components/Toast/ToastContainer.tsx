import { useEffect, useState } from 'react';
import type { ToastItem } from './Toast.types';
import { toast } from './toastService';
import { ToastItemView } from './ToastItemView';
import './Toast.css';

interface Props {
  className?: string;
}

export const ToastContainer = ({ className = '' }: Props) => {
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

