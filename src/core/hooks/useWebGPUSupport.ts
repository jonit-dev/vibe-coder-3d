import { useEffect, useState } from 'react';

import { Logger } from '@core/lib/logger';
import {
  checkWebGPUBrowserSupport,
  detectWebGPU,
  getWebGPUCapabilities,
  type IWebGPUCapabilities,
} from '@core/utils/webgpu';

const logger = Logger.create('useWebGPUSupport');

export interface IWebGPUSupportInfo {
  isSupported: boolean;
  isChecking: boolean;
  browserSupport: {
    supported: boolean;
    message: string;
  };
  capabilities: IWebGPUCapabilities | null;
  error: Error | null;
}

/**
 * Hook to check WebGPU support and capabilities
 */
export function useWebGPUSupport(): IWebGPUSupportInfo {
  const [isSupported, setIsSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [browserSupport, setBrowserSupport] = useState({ supported: false, message: '' });
  const [capabilities, setCapabilities] = useState<IWebGPUCapabilities | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSupport = async () => {
      try {
        // Check browser compatibility
        const browser = checkWebGPUBrowserSupport();
        if (mounted) {
          setBrowserSupport(browser);
        }

        // Detect WebGPU availability
        const supported = await detectWebGPU();
        if (mounted) {
          setIsSupported(supported);
        }

        // Get capabilities if supported
        if (supported) {
          const caps = await getWebGPUCapabilities();
          if (mounted) {
            setCapabilities(caps);
          }
        }
      } catch (err) {
        logger.error('Error checking WebGPU support', { error: err });
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    checkSupport();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    isSupported,
    isChecking,
    browserSupport,
    capabilities,
    error,
  };
}

/**
 * Hook to show WebGPU compatibility warning if needed
 */
export function useWebGPUWarning(): string | null {
  const { isSupported, browserSupport, isChecking } = useWebGPUSupport();

  if (isChecking) {
    return null;
  }

  if (!isSupported && !browserSupport.supported) {
    return browserSupport.message;
  }

  if (!isSupported && browserSupport.supported) {
    return 'WebGPU is supported by your browser but not currently available';
  }

  return null;
}
