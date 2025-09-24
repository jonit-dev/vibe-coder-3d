import { useToastStore, type IToast, type ToastType } from '@/core/stores/toastStore';
import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheck, FiInfo, FiLoader, FiX, FiXCircle } from 'react-icons/fi';

// Icon mapping for each toast type
const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <FiCheck className="w-5 h-5" />;
    case 'error':
      return <FiXCircle className="w-5 h-5" />;
    case 'warning':
      return <FiAlertTriangle className="w-5 h-5" />;
    case 'info':
      return <FiInfo className="w-5 h-5" />;
    case 'loading':
      return <FiLoader className="w-5 h-5 animate-spin" />;
    default:
      return <FiInfo className="w-5 h-5" />;
  }
};

// Color scheme mapping for each toast type
const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        container: 'bg-green-900/90 border-green-700/50 text-green-100',
        icon: 'text-green-400',
        progress: 'bg-green-400',
      };
    case 'error':
      return {
        container: 'bg-red-900/90 border-red-700/50 text-red-100',
        icon: 'text-red-400',
        progress: 'bg-red-400',
      };
    case 'warning':
      return {
        container: 'bg-yellow-900/90 border-yellow-700/50 text-yellow-100',
        icon: 'text-yellow-400',
        progress: 'bg-yellow-400',
      };
    case 'info':
      return {
        container: 'bg-blue-900/90 border-blue-700/50 text-blue-100',
        icon: 'text-blue-400',
        progress: 'bg-blue-400',
      };
    case 'loading':
      return {
        container: 'bg-purple-900/90 border-purple-700/50 text-purple-100',
        icon: 'text-purple-400',
        progress: 'bg-purple-400',
      };
    default:
      return {
        container: 'bg-gray-900/90 border-gray-700/50 text-gray-100',
        icon: 'text-gray-400',
        progress: 'bg-gray-400',
      };
  }
};

// Progress bar component using Tailwind utilities
interface IProgressBarProps {
  duration: number;
  color: string;
}

const ProgressBar: React.FC<IProgressBarProps> = ({ duration, color }) => {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setWidth(remaining);

      if (remaining > 0) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [duration]);

  return (
    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all ease-linear`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

interface IToastItemProps {
  toast: IToast;
}

const ToastItem: React.FC<IToastItemProps> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);
  const styles = getToastStyles(toast.type);
  const icon = getToastIcon(toast.type);

  const handleClose = () => {
    removeToast(toast.id);
  };

  const handleActionClick = () => {
    if (toast.action?.onClick) {
      toast.action.onClick();
      removeToast(toast.id);
    }
  };

  return (
    <div
      className={`
        ${styles.container}
        border backdrop-blur-sm shadow-2xl rounded-lg p-4 mb-3 
        transform transition-all duration-300 ease-out
        animate-in slide-in-from-right duration-300
        hover:shadow-lg hover:scale-[1.02]
        max-w-sm w-full
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{toast.title}</div>
          {toast.message && (
            <div className="text-xs opacity-90 mt-1 line-clamp-2">{toast.message}</div>
          )}

          {/* Action button */}
          {toast.action && (
            <button
              onClick={handleActionClick}
              className={`
                mt-2 text-xs px-2 py-1 rounded 
                bg-white/10 hover:bg-white/20 transition-colors
                border border-white/20 hover:border-white/30
              `}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/60 hover:text-white/90 transition-colors"
          aria-label="Close notification"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss toasts */}
      {!toast.persistent && toast.type !== 'loading' && toast.duration && (
        <ProgressBar duration={toast.duration} color={styles.progress} />
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  // Limit visible toasts to prevent UI overflow
  const visibleToasts = toasts.slice(-5);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-[9999] pointer-events-auto"
      aria-label="Notifications"
      role="region"
    >
      {visibleToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
