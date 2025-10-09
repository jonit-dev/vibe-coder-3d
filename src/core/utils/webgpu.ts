import { Logger } from '@core/lib/logger';

const logger = Logger.create('WebGPU');

export interface IWebGPUCapabilities {
  supported: boolean;
  adapter: GPUAdapter | null;
  features: string[];
  limits: Record<string, number>;
}

/**
 * Detect WebGPU support in the current browser
 */
export const detectWebGPU = async (): Promise<boolean> => {
  if (!navigator.gpu) {
    logger.debug('WebGPU not available in navigator');
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      logger.debug('WebGPU adapter not available');
      return false;
    }
    logger.info('WebGPU is supported');
    return true;
  } catch (error) {
    logger.warn('WebGPU detection failed', { error });
    return false;
  }
};

/**
 * Get detailed WebGPU capabilities
 */
export const getWebGPUCapabilities = async (): Promise<IWebGPUCapabilities> => {
  if (!navigator.gpu) {
    return {
      supported: false,
      adapter: null,
      features: [],
      limits: {},
    };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        adapter: null,
        features: [],
        limits: {},
      };
    }

    const features = Array.from(adapter.features);
    const limits: Record<string, number> = {};

    // Convert GPUSupportedLimits to plain object
    Object.entries(adapter.limits).forEach(([key, value]) => {
      limits[key] = value as number;
    });

    logger.info('WebGPU capabilities', { features, limits });

    return {
      supported: true,
      adapter,
      features,
      limits,
    };
  } catch (error) {
    logger.error('Failed to get WebGPU capabilities', { error });
    return {
      supported: false,
      adapter: null,
      features: [],
      limits: {},
    };
  }
};

/**
 * Check browser compatibility for WebGPU
 */
export const checkWebGPUBrowserSupport = (): {
  supported: boolean;
  message: string;
} => {
  const userAgent = navigator.userAgent.toLowerCase();

  // Chrome/Edge 113+
  const chromeMatch = userAgent.match(/chrome\/(\d+)/);
  const edgeMatch = userAgent.match(/edg\/(\d+)/);

  if (chromeMatch) {
    const version = parseInt(chromeMatch[1], 10);
    if (version >= 113) {
      return { supported: true, message: `Chrome ${version} supports WebGPU` };
    }
    return {
      supported: false,
      message: `Chrome ${version} detected. WebGPU requires Chrome 113+`,
    };
  }

  if (edgeMatch) {
    const version = parseInt(edgeMatch[1], 10);
    if (version >= 113) {
      return { supported: true, message: `Edge ${version} supports WebGPU` };
    }
    return {
      supported: false,
      message: `Edge ${version} detected. WebGPU requires Edge 113+`,
    };
  }

  // Firefox 127+ (behind flag)
  const firefoxMatch = userAgent.match(/firefox\/(\d+)/);
  if (firefoxMatch) {
    const version = parseInt(firefoxMatch[1], 10);
    return {
      supported: version >= 127,
      message:
        version >= 127
          ? `Firefox ${version} may support WebGPU (requires enabling dom.webgpu.enabled flag)`
          : `Firefox ${version} detected. WebGPU requires Firefox 127+`,
    };
  }

  // Safari 18+
  const safariMatch = userAgent.match(/version\/(\d+).*safari/);
  if (safariMatch) {
    const version = parseInt(safariMatch[1], 10);
    if (version >= 18) {
      return { supported: true, message: `Safari ${version} supports WebGPU` };
    }
    return {
      supported: false,
      message: `Safari ${version} detected. WebGPU requires Safari 18+`,
    };
  }

  return {
    supported: false,
    message: 'Browser not recognized. WebGPU may not be supported.',
  };
};

/**
 * Initialize WebGPU and return device and context
 */
export const initializeWebGPU = async (
  canvas: HTMLCanvasElement
): Promise<{
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
} | null> => {
  try {
    if (!navigator.gpu) {
      logger.error('WebGPU not available');
      return null;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      logger.error('Failed to get WebGPU adapter');
      return null;
    }

    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as GPUCanvasContext;

    if (!context) {
      logger.error('Failed to get WebGPU context');
      return null;
    }

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    });

    logger.info('WebGPU initialized successfully', { format });

    return { device, context, format };
  } catch (error) {
    logger.error('WebGPU initialization failed', { error });
    return null;
  }
};
