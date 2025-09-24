/**
 * Project Selector Component
 * Allows switching between different game projects
 */

import React from 'react';
import { useProjectStore } from '../../store/projectStore';

export const ProjectSelector: React.FC = () => {
  const { currentProject, isLoading, error, loadProject } = useProjectStore();

  // For now, we only have one project config
  // In the future, this could load from multiple project directories
  const availableProjects = [
    {
      name: 'Sample Game',
      version: '1.0.0',
      assetBasePath: '/assets',
      startupScene: 'game.default',
    },
  ];

  const handleProjectSelect = (projectConfig: any) => {
    loadProject(projectConfig);
  };

  if (isLoading) {
    return (
      <div className="project-selector p-2 border-b border-gray-600">
        <div className="text-sm text-gray-400">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="project-selector p-2 border-b border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300">Project</label>
        {error && (
          <div className="text-xs text-red-400" title={error}>
            Error
          </div>
        )}
      </div>

      <select
        className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
        value={currentProject?.name || ''}
        onChange={(e) => {
          const selected = availableProjects.find((p) => p.name === e.target.value);
          if (selected) {
            handleProjectSelect(selected);
          }
        }}
      >
        <option value="">Select a project...</option>
        {availableProjects.map((project) => (
          <option key={project.name} value={project.name}>
            {project.name} (v{project.version})
          </option>
        ))}
      </select>

      {currentProject && (
        <div className="mt-2 text-xs text-gray-400">
          <div>Assets: {currentProject.assetBasePath}</div>
          <div>Startup: {currentProject.startupScene}</div>
        </div>
      )}

      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
    </div>
  );
};
