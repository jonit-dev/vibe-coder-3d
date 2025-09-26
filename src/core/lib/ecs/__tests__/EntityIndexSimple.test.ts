import { describe, it, expect, beforeEach } from 'vitest';
import { EntityIndex } from '../indexers/EntityIndex';

describe('EntityIndex (Simple)', () => {
  let index: EntityIndex;

  beforeEach(() => {
    index = new EntityIndex();
  });

  it('should add and check entity existence', () => {
    index.add(1);
    expect(index.has(1)).toBe(true);
    expect(index.has(2)).toBe(false);
  });

  it('should list entities', () => {
    index.add(1);
    index.add(2);
    const entities = index.list();
    expect(entities.sort()).toEqual([1, 2]);
  });

  it('should remove entities', () => {
    index.add(1);
    index.add(2);
    index.delete(1);
    expect(index.has(1)).toBe(false);
    expect(index.has(2)).toBe(true);
  });
});