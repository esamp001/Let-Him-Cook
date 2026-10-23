import type { ToastItem } from './Toast.types';

interface Props {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastItemView = ({ item, onDismiss }: Props) => {
  const renderIcon = () => {
    switch (item.type) {
      case 'success':
        return (
          <div className="toast-badge-circle" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 8.5L6.5 11.5L12.5 4.5"
                stroke="#1b5e3c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="toast-badge-circle" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="4.5" r="1.25" fill="#1e5ea8" />
              <rect x="6.75" y="7" width="2.5" height="5.5" rx="1" fill="#1e5ea8" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="toast-badge-triangle" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5L22 20.5H2L12 2.5Z"
                fill="#ffffff"
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <path
                d="M12 9V13.5"
                stroke="#af6815"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17" r="1.2" fill="#af6815" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="toast-badge-circle" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
                stroke="#a02b2b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className={`toast-pill toast-${item.type}`}
      role="status"
      aria-live="polite"
    >
      <div className="toast-badge">{renderIcon()}</div>
      <div className="toast-message">{item.message}</div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={() => onDismiss(item.id)}
        aria-label="Close notification"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 2L12 12M12 2L2 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

