/**
 * Hook to access all engine services from the current EngineContext
 * Provides typed access to world, managers, and loop store
 */
import { useEngineContext } from '@core/context/EngineProvider';

/**
 * Access all engine services from the nearest EngineProvider
 * Throws if used outside of an EngineProvider
 */
export const useEngine = () => {
  return useEngineContext();
};