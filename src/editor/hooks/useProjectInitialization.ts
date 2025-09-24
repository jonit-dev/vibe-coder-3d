/**
 * Project Initialization Hook
 * Automatically loads the game project and registers its extensions
 */

import { useEffect } from 'react';
import { registerGameExtensions, gameProjectConfig } from '@game';
import { useProjectStore } from '../store/projectStore';

export const useProjectInitialization = () => {
  const { loadProject, currentProject } = useProjectStore();

  useEffect(() => {
    // Auto-load the game project if no project is currently loaded
    if (!currentProject) {
      // Register all game extensions first
      registerGameExtensions();

      // Then load the project configuration
      loadProject(gameProjectConfig);
    }
  }, [loadProject, currentProject]);

  return {
    currentProject,
    isProjectReady: !!currentProject,
  };
};
