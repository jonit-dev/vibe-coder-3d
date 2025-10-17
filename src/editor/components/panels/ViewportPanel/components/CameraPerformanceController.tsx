import { useAdaptiveQuality } from './hooks/useAdaptiveQuality';

export const CameraPerformanceController: React.FC = () => {
  useAdaptiveQuality({
    minPixelRatio: 1,
    restoreDelayMs: 150,
    pauseShadowUpdatesWhileMoving: true,
  });
  return null;
};
