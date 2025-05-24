import React from 'react';

import { ComponentGroupManager } from '@/core/lib/component-groups';
import { componentRegistry } from '@/core/lib/component-registry';
import { ArchetypeManager } from '@/core/lib/entity-archetypes';

export const ComponentDebugger: React.FC = () => {
  const allComponents = componentRegistry.getAllComponents();
  const allGroups = ComponentGroupManager.getAllGroups();
  const allArchetypes = ArchetypeManager.listArchetypes();

  return (
    <div className="p-4 bg-gray-900 text-white max-h-64 overflow-y-auto">
      <h3 className="text-lg font-bold mb-2">Component System Debug</h3>

      <div className="mb-4">
        <h4 className="text-md font-semibold text-green-400">
          Components ({allComponents.length})
        </h4>
        {allComponents.length === 0 && (
          <p className="text-red-400 text-xs">⚠️ No components are registered!</p>
        )}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {allComponents.map((component) => (
            <div key={component.id} className="text-xs">
              <span className="text-green-400">{component.id}</span> - {component.name}
              <span className="text-gray-400 ml-2">({component.category})</span>
              {component.dependencies && component.dependencies.length > 0 && (
                <span className="text-yellow-400 ml-2">
                  deps: {component.dependencies.join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-md font-semibold text-blue-400">
          Component Groups ({allGroups.length})
        </h4>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {allGroups.map((group) => (
            <div key={group.id} className="text-xs">
              <span className="text-blue-400">{group.id}</span> - {group.name}
              <span className="text-gray-400 ml-2">[{group.components.join(', ')}]</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold text-purple-400">
          Archetypes ({allArchetypes.length})
        </h4>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {allArchetypes.map((archetype) => (
            <div key={archetype.id} className="text-xs">
              <span className="text-purple-400">{archetype.id}</span> - {archetype.name}
              <span className="text-gray-400 ml-2">[{archetype.components.join(', ')}]</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
