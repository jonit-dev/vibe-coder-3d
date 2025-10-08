import { useState, useCallback } from 'react';
import type { IStreamingScene } from '@/core/lib/serialization/StreamingSceneSerializer';

export interface ISceneFileInfo {
  name: string;
  modified: string;
  size: number;
  type?: 'json' | 'tsx';
}

export interface IScenePersistenceState {
  isLoading: boolean;
  error: string | null;
  availableScenes: ISceneFileInfo[];
  lastSavedScene: string | null;
}

export interface IScenePersistenceActions {
  saveScene: (name: string, data: IStreamingScene, format?: 'json' | 'tsx') => Promise<boolean>;
  saveTsxScene: (
    name: string,
    entities: unknown[],
    materials?: unknown[],
    prefabs?: unknown[],
    options?: { description?: string; author?: string },
    inputAssets?: unknown[],
  ) => Promise<boolean>;
  loadScene: (name: string) => Promise<IStreamingScene | null>;
  listScenes: () => Promise<boolean>;
  listTsxScenes: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook for managing scene persistence via the scene API
 * Handles loading states, error management, and API communication
 */
export function useScenePersistence(): IScenePersistenceState & IScenePersistenceActions {
  const [state, setState] = useState<IScenePersistenceState>({
    isLoading: false,
    error: null,
    availableScenes: [],
    lastSavedScene: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Save scene to server via API
   */
  const saveScene = useCallback(
    async (
      name: string,
      data: IStreamingScene,
      format: 'json' | 'tsx' = 'json',
    ): Promise<boolean> => {
      if (!name.trim()) {
        setError('Scene name cannot be empty');
        return false;
      }

      setLoading(true);
      clearError();

      try {
        const endpoint = format === 'tsx' ? '/api/scene/save-tsx' : '/api/scene/save';
        const payload =
          format === 'tsx'
            ? {
                name: name.trim(),
                entities: data.entities,
                materials: data.materials || [],
                description: data.name,
              }
            : { name: name.trim(), data };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Save operation failed');
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
          lastSavedScene: result.filename,
        }));

        // Refresh scene list after successful save
        await listScenes();

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save scene';
        setError(errorMessage);
        return false;
      }
    },
    [setLoading, setError, clearError],
  );

  /**
   * Load scene from server via API (prioritizes TSX format)
   */
  const loadScene = useCallback(
    async (name: string): Promise<IStreamingScene | null> => {
      if (!name.trim()) {
        setError('Scene name cannot be empty');
        return null;
      }

      setLoading(true);
      clearError();

      try {
        // Try loading as TSX first
        const response = await fetch(`/api/scene/load-tsx?name=${encodeURIComponent(name.trim())}`);
        const result = await response.json();

        if (!response.ok) {
          // If TSX loading fails, try JSON as fallback
          if (response.status === 404) {
            const jsonResponse = await fetch(
              `/api/scene/load?name=${encodeURIComponent(name.trim())}`,
            );
            const jsonResult = await jsonResponse.json();

            if (!jsonResponse.ok) {
              throw new Error(
                jsonResult.error || `HTTP ${jsonResponse.status}: ${jsonResponse.statusText}`,
              );
            }

            if (!jsonResult.success) {
              throw new Error(jsonResult.error || 'Load operation failed');
            }

            setLoading(false);
            return jsonResult.data;
          }

          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Load operation failed');
        }

        setLoading(false);
        return result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load scene';
        setError(errorMessage);
        return null;
      }
    },
    [setLoading, setError, clearError],
  );

  /**
   * List available scenes from server via API
   */
  const listScenes = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch('/api/scene/list');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'List operation failed');
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        availableScenes: result.scenes || [],
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list scenes';
      setError(errorMessage);
      return false;
    }
  }, [setLoading, setError, clearError]);

  /**
   * Save scene as TSX component
   */
  const saveTsxScene = useCallback(
    async (
      name: string,
      entities: unknown[],
      materials: unknown[] = [],
      prefabs: unknown[] = [],
      options: { description?: string; author?: string } = {},
      inputAssets: unknown[] = [],
    ): Promise<boolean> => {
      if (!name.trim()) {
        setError('Scene name cannot be empty');
        return false;
      }

      setLoading(true);
      clearError();

      try {
        // Saving TSX scene

        const response = await fetch('/api/scene/save-tsx', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            entities,
            materials,
            prefabs,
            inputAssets,
            description: options.description,
            author: options.author,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Save operation failed');
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
          lastSavedScene: result.filename,
        }));

        // Refresh scene list after successful save
        await listTsxScenes();

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save TSX scene';
        setError(errorMessage);
        return false;
      }
    },
    [setLoading, setError, clearError],
  );

  /**
   * List available TSX scenes from server via API
   */
  const listTsxScenes = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch('/api/scene/list-tsx');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'List operation failed');
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        availableScenes: result.scenes || [],
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list TSX scenes';
      setError(errorMessage);
      return false;
    }
  }, [setLoading, setError, clearError]);

  return {
    ...state,
    saveScene,
    saveTsxScene,
    loadScene,
    listScenes,
    listTsxScenes,
    clearError,
  };
}
