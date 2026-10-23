import type { ToastItem, ToastOptions, ToastType } from './Toast.types';

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(type: ToastType, message: string, options?: ToastOptions): string {
    const id = crypto.randomUUID();
    const duration = options?.duration ?? 3500;
    const newToast: ToastItem = { id, type, message, duration };

    this.toasts = [...this.toasts, newToast];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public clearAll() {
    this.toasts = [];
    this.notify();
  }
}

const manager = new ToastManager();

export const toast = {
  success: (message: string, options?: ToastOptions) => manager.show('success', message, options),
  info: (message: string, options?: ToastOptions) => manager.show('info', message, options),
  warning: (message: string, options?: ToastOptions) => manager.show('warning', message, options),
  error: (message: string, options?: ToastOptions) => manager.show('error', message, options),
  dismiss: (id: string) => manager.dismiss(id),
  clearAll: () => manager.clearAll(),
  _subscribe: (listener: ToastListener) => manager.subscribe(listener),
};

