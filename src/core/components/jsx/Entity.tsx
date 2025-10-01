/**
 * Entity JSX Component - Creates and manages ECS entities in React/R3F style
 * Provides entity context to child components and handles lifecycle
 */

import React, { useEffect, useRef, useState } from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { generatePersistentId } from '@/core/lib/ecs/components/definitions/PersistentIdComponent';
import { EntityId } from '@/core/lib/ecs/types';

import { EntityProvider } from './EntityContext';

export interface IEntityProps {
  /** Entity name (defaults to 'Entity') */
  name?: string;
  /** Persistent ID for stable identity (auto-generated if not provided) */
  persistentId?: string;
  /** Parent entity ID for hierarchy */
  parentId?: EntityId;
  /** Children components */
  children?: React.ReactNode;
  /** Debug mode - logs entity operations */
  debug?: boolean;
}

export const Entity: React.FC<IEntityProps> = ({
  name = 'Entity',
  persistentId,
  parentId,
  children,
}) => {
  const [entityId, setEntityId] = useState<EntityId | null>(null);
  const [actualPersistentId, setActualPersistentId] = useState<string | null>(null);
  const entityManager = useRef(EntityManager.getInstance());
  const hasCreatedEntity = useRef(false);

  useEffect(() => {
    // Prevent double creation in React StrictMode
    if (hasCreatedEntity.current) return;
    hasCreatedEntity.current = true;


    try {
      // Create the entity
      const entity = entityManager.current.createEntity(name, parentId);

      // Set or generate persistent ID
      const finalPersistentId = persistentId || generatePersistentId();

      // Override the auto-generated PersistentId with our specified one
      if (componentRegistry.hasComponent(entity.id, 'PersistentId')) {
        componentRegistry.updateComponent(entity.id, 'PersistentId', {
          id: finalPersistentId,
        });
      } else {
        componentRegistry.addComponent(entity.id, 'PersistentId', {
          id: finalPersistentId,
        });
      }

      setEntityId(entity.id);
      setActualPersistentId(finalPersistentId);

    } catch (error) {
      console.error(`[Entity] Failed to create entity: ${name}`, error);
    }

    // Cleanup function
    return () => {
      if (entityId !== null) {
        try {
          entityManager.current.deleteEntity(entityId);
        } catch (error) {
          console.warn(`[Entity] Failed to cleanup entity ${entityId}:`, error);
        }
      }
    };
  }, []); // Empty deps - only create once

  // Don't render children until entity is created
  if (entityId === null || actualPersistentId === null) {
    return null;
  }

  return (
    <EntityProvider
      value={{
        entityId,
        entityName: name,
        persistentId: actualPersistentId,
      }}
    >
      {children}
    </EntityProvider>
  );
};

// Development helper for debugging entity trees
export const EntityDebug: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div style={{ border: '1px dashed #ccc', margin: '2px', padding: '2px' }}>{children}</div>;
};
