/**
 * Project Store - Manages current project selection and configuration
 */

import { create } from 'zustand';
import { IGameProjectConfig, initializeGameProject, getCurrentProjectConfig } from '@core';

interface IProjectState {
  currentProject: IGameProjectConfig | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProject: (projectConfig: IGameProjectConfig) => void;
  setCurrentProject: (project: IGameProjectConfig) => void;
  clearProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<IProjectState>((set, get) => ({
  currentProject: null,
  isLoading: false,
  error: null,

  loadProject: async (projectConfig: IGameProjectConfig) => {
    const { setLoading, setError, setCurrentProject } = get();

    try {
      setLoading(true);
      setError(null);

      // Initialize the project using core extension points
      initializeGameProject(projectConfig);

      // Verify the project was loaded
      const loadedConfig = getCurrentProjectConfig();
      if (loadedConfig) {
        setCurrentProject(loadedConfig);
        console.log(`[ProjectStore] Project loaded: ${loadedConfig.name}`);
      } else {
        throw new Error('Failed to initialize project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      console.error('[ProjectStore] Error loading project:', error);
    } finally {
      setLoading(false);
    }
  },

  setCurrentProject: (project: IGameProjectConfig) => {
    set({ currentProject: project, error: null });
  },

  clearProject: () => {
    set({ currentProject: null, error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
