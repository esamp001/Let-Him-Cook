import type { ToastItem } from './ToastItem';

export interface ToastItemViewProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}
