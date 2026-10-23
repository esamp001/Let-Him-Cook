export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // duration in ms, defaults to 3500ms
}

export interface ToastOptions {
  duration?: number;
}

