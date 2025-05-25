import { EntityId } from './types';

export interface IEntity {
  id: EntityId;
  name: string;
  children: EntityId[];
  parentId?: EntityId;
}
