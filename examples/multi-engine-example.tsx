import React from 'react';

import { EngineProvider, useEntityManager, useECSWorld } from '@core/context';

/**
 * Example demonstrating multiple isolated engine instances
 * Each EngineProvider creates its own isolated ECS world
 */

const EngineStats: React.FC<{ label: string }> = ({ label }) => {
  const { world } = useECSWorld();
  const { entityManager } = useEntityManager();

  const entityCount = entityManager?.getEntityCount() || 0;

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">{label}</h3>
      <p>World ID: {world ? 'Present' : 'Missing'}</p>
      <p>Entities: {entityCount}</p>
      <button
        onClick={() => {
          if (entityManager) {
            entityManager.createEntity(`Entity-${Date.now()}`);
          }
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add Entity
      </button>
    </div>
  );
};

const MultiEngineExample: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Multi-Engine Example</h1>
      <p className="mb-4">
        This example shows two isolated engine instances running side by side. Each has its own
        ECS world, entity manager, and component manager.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <EngineProvider>
          <EngineStats label="Engine A" />
        </EngineProvider>

        <EngineProvider>
          <EngineStats label="Engine B" />
        </EngineProvider>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">How this works:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Each EngineProvider creates an isolated engine instance</li>
          <li>Entities created in one engine don't affect the other</li>
          <li>Each engine has its own world, entity manager, and component manager</li>
          <li>This enables multiple editors, games, or simulations running simultaneously</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiEngineExample;