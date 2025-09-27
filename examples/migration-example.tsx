import React from 'react';

import { EngineProvider } from '@core/context';
import { getEntityManagerSingleton } from '@core/lib/ecs/adapters/SingletonAdapter';
import { useEntityManager } from '@editor/hooks/useEntityManager';

/**
 * Example demonstrating migration from singleton to context-based approach
 */

// Old approach: Direct singleton usage (deprecated)
const OldApproach: React.FC = () => {
  const handleCreateEntity = () => {
    // This uses the singleton adapter and will show deprecation warning
    const entityManager = getEntityManagerSingleton();
    entityManager.createEntity('Old-Entity');
  };

  return (
    <div className="p-4 border border-red-300 rounded">
      <h3 className="font-bold text-red-600">Old Approach (Deprecated)</h3>
      <p className="text-sm text-gray-600 mb-2">
        Direct singleton usage - will show deprecation warnings
      </p>
      <button
        onClick={handleCreateEntity}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Create Entity (Old Way)
      </button>
    </div>
  );
};

// New approach: Context-based with fallback
const NewApproach: React.FC = () => {
  const entityManager = useEntityManager(); // This hook handles context + fallback

  const handleCreateEntity = () => {
    entityManager.createEntity('New-Entity');
  };

  const entityCount = entityManager.getEntityCount();

  return (
    <div className="p-4 border border-green-300 rounded">
      <h3 className="font-bold text-green-600">New Approach (Recommended)</h3>
      <p className="text-sm text-gray-600 mb-2">
        Context-based with singleton fallback for compatibility
      </p>
      <p className="mb-2">Entities: {entityCount}</p>
      <button
        onClick={handleCreateEntity}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Create Entity (New Way)
      </button>
    </div>
  );
};

const MigrationExample: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Migration Example</h1>
      <p className="mb-4">
        This example shows how to migrate from singleton pattern to dependency injection.
      </p>

      <div className="space-y-4">
        {/* Without provider - shows fallback behavior */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Without EngineProvider (Legacy Mode)</h2>
          <div className="space-y-2">
            <OldApproach />
            <NewApproach />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Both approaches fall back to singleton when no provider is available
          </p>
        </div>

        {/* With provider - shows new context behavior */}
        <div>
          <h2 className="text-lg font-semibold mb-2">With EngineProvider (New Mode)</h2>
          <EngineProvider>
            <div className="space-y-2">
              <OldApproach />
              <NewApproach />
            </div>
          </EngineProvider>
          <p className="text-sm text-gray-600 mt-2">
            New approach uses context, old approach shows deprecation warnings
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-100 rounded">
        <h3 className="font-bold mb-2">Migration Steps:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Wrap your app/components with EngineProvider</li>
          <li>Replace direct getInstance() calls with context hooks</li>
          <li>Use dependency injection where possible</li>
          <li>Remove singleton adapters after migration is complete</li>
        </ol>
      </div>
    </div>
  );
};

export default MigrationExample;