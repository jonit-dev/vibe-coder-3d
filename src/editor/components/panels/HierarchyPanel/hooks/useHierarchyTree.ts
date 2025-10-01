import { useMemo } from 'react';

import { IEntity } from '@/core/lib/ecs/IEntity';
import { useEntityManager } from '@/editor/hooks/useEntityManager';

export interface IHierarchyTreeNode {
  entity: IEntity;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export const useHierarchyTree = (
  entityIds: number[],
  expandedNodes: Set<number>,
): IHierarchyTreeNode[] => {
  const entityManager = useEntityManager();

  return useMemo(() => {
    const allEntities = entityIds
      .map((id) => entityManager.getEntity(id))
      .filter(Boolean) as IEntity[];
    const entityMap = new Map(allEntities.map((e) => [e.id, e]));

    const buildTree = (entity: IEntity, depth = 0): IHierarchyTreeNode[] => {
      const hasChildren = entity.children.length > 0;
      const isExpanded = expandedNodes.has(entity.id);

      const nodes: IHierarchyTreeNode[] = [
        {
          entity,
          depth,
          hasChildren,
          isExpanded,
        },
      ];

      if (isExpanded && hasChildren) {
        entity.children.forEach((childId) => {
          const childEntity = entityMap.get(childId);
          if (childEntity) {
            nodes.push(...buildTree(childEntity, depth + 1));
          }
        });
      }

      return nodes;
    };

    const rootEntities = allEntities.filter((e) => !e.parentId);
    const tree: IHierarchyTreeNode[] = [];

    rootEntities.forEach((entity) => {
      tree.push(...buildTree(entity));
    });

    return tree;
  }, [entityIds, entityManager, expandedNodes]);
};
