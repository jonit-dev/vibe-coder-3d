import { useEffect, useState } from 'react';

import { useWebGPUWarning } from '@core/hooks/useWebGPUSupport';

export interface IWebGPUCompatibilityBannerProps {
  /** Whether to show the banner - default: true */
  show?: boolean;

  /** Auto-dismiss after X milliseconds - default: never */
  autoDismiss?: number;

  /** Position of the banner - default: 'top-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';

  /** Custom className for additional styling */
  className?: string;

  /** Callback when banner is dismissed */
  onDismiss?: () => void;
}

const positionClasses: Record<string, string> = {
  'top-left': 'top-2.5 left-2.5',
  'top-right': 'top-2.5 right-2.5',
  'bottom-left': 'bottom-2.5 left-2.5',
  'bottom-right': 'bottom-2.5 right-2.5',
  'top-center': 'top-2.5 left-1/2 -translate-x-1/2',
};

/**
 * WebGPU Compatibility Banner
 * Displays a warning if WebGPU is not supported
 */
export function WebGPUCompatibilityBanner({
  show = true,
  autoDismiss,
  position = 'top-right',
  className = '',
  onDismiss,
}: IWebGPUCompatibilityBannerProps) {
  const warning = useWebGPUWarning();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (autoDismiss && warning && !isDismissed) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
        onDismiss?.();
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, warning, isDismissed, onDismiss]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!show || !warning || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} bg-yellow-400/95 text-black px-4 py-3 rounded-md text-sm z-[10000] max-w-[350px] shadow-lg flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="font-bold mb-1">⚠️ WebGPU Not Available</div>
          <div className="text-xs leading-relaxed">{warning}</div>
        </div>
        <button
          onClick={handleDismiss}
          className="bg-transparent border-none cursor-pointer text-lg p-0 leading-none text-black opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="text-[11px] opacity-80 pt-1 border-t border-black/10">
        Using WebGL fallback renderer
      </div>
    </div>
  );
}

/**
 * Compact version of the compatibility banner
 */
export function WebGPUCompatibilityIndicator() {
  const warning = useWebGPUWarning();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!warning) {
    return null;
  }

  return (
    <div className="fixed bottom-2.5 left-2.5 z-[10000]">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-yellow-400/90 border-none rounded-full w-9 h-9 cursor-pointer text-lg flex items-center justify-center shadow-md hover:bg-yellow-400 transition-colors"
          aria-label="WebGPU warning"
          title="WebGPU compatibility warning"
        >
          ⚠️
        </button>
      ) : (
        <div className="bg-yellow-400/95 text-black p-2.5 px-3 rounded-md text-xs max-w-[250px] shadow-lg">
          <div className="flex justify-between mb-1.5">
            <strong>⚠️ WebGPU</strong>
            <button
              onClick={() => setIsExpanded(false)}
              className="bg-transparent border-none cursor-pointer text-base p-0 leading-none hover:opacity-70 transition-opacity"
              aria-label="Collapse"
            >
              ×
            </button>
          </div>
          <div className="text-[11px] leading-relaxed">{warning}</div>
        </div>
      )}
    </div>
  );
}
