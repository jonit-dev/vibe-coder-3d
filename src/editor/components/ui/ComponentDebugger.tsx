import React from 'react';

import { componentManager } from '@/core/dynamic-components/init';

export const ComponentDebugger: React.FC = () => {
  const allComponents = componentManager.getAllComponents();
  const allGroups = componentManager.getAllGroups();

  return (
    <div className="p-4 bg-gray-800 text-white text-xs">
      <h3 className="font-bold mb-2">Component Registry Debug</h3>
      <div className="mb-4">
        <strong>Registered Components ({allComponents.length}):</strong>
        <ul className="ml-4 mt-1">
          {allComponents.map((comp) => (
            <li key={comp.id}>
              {comp.id} - {comp.name} ({comp.category})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Registered Groups ({allGroups.length}):</strong>
        <ul className="ml-4 mt-1">
          {allGroups.map((group) => (
            <li key={group.id}>
              {group.id} - {group.name} ({group.components.join(', ')})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
