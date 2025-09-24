/**
 * Entity Context - Provides current entity reference through JSX component tree
 * Allows child components to access parent entity for component operations
 */

import React, { createContext, useContext } from 'react';

import { EntityId } from '@/core/lib/ecs/types';

interface IEntityContext {
  entityId: EntityId;
  entityName: string;
  persistentId: string;
}

const EntityContext = createContext<IEntityContext | null>(null);

export const EntityProvider: React.FC<{
  value: IEntityContext;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <EntityContext.Provider value={value}>{children}</EntityContext.Provider>
);

export function useEntityContext(): IEntityContext {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntityContext must be used within an <Entity> component');
  }
  return context;
}

export function useEntityContextOptional(): IEntityContext | null {
  return useContext(EntityContext);
}
