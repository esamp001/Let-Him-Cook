import type { ToastType } from '../../components/Toast/Toast.types';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
