import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock providers for testing
const MockCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="mock-canvas">{children}</div>;
};

// All the providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

// Custom render function
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Render with Three.js Canvas (for 3D components)
const renderWithCanvas = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders>
      <MockCanvas>{children}</MockCanvas>
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock component manager for ECS tests
export const createMockComponentManager = () => ({
  getComponent: vi.fn(),
  updateComponent: vi.fn(),
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
  hasComponent: vi.fn(),
  getComponentsForEntity: vi.fn(),
  getEntitiesWithComponent: vi.fn(),
});

// Mock entity manager for ECS tests
export const createMockEntityManager = () => ({
  getEntity: vi.fn(),
  createEntity: vi.fn(),
  deleteEntity: vi.fn(),
  setParent: vi.fn(),
  getAllEntities: vi.fn(),
});

// Mock store for testing
export const createMockEditorStore = () => ({
  selectedId: null,
  setSelectedId: vi.fn(),
  selectedIds: [],
  setSelectedIds: vi.fn(),
  addToSelection: vi.fn(),
  removeFromSelection: vi.fn(),
  toggleSelection: vi.fn(),
  clearSelection: vi.fn(),
  entityIds: [],
  setEntityIds: vi.fn(),
  statusMessage: 'Ready',
  setStatusMessage: vi.fn(),
});

// Helper to create mock transform data
export const createMockTransform = (
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
) => ({
  position,
  rotation,
  scale,
});

// Helper to create mock entity
export const createMockEntity = (id: number, name = `Entity ${id}`) => ({
  id,
  name,
  parentId: undefined,
  children: [],
});

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, renderWithCanvas };
export { vi } from 'vitest';
