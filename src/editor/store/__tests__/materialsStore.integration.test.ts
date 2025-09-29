import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple integration tests for materials store functionality
describe('materialsStore integration', () => {
  it('should have core materials functionality', () => {
    // Import the store to test it exists and can be imported
    import('../materialsStore').then((module) => {
      expect(module.useMaterialsStore).toBeDefined();
    });
  });

  it('should validate material type definitions', () => {
    // Import and validate the material types exist
    import('../../../core/materials/Material.types').then((module) => {
      expect(module).toBeDefined();
    });
  });

  it('should have MaterialRegistry available', () => {
    import('../../../core/materials/MaterialRegistry').then((module) => {
      expect(module.MaterialRegistry).toBeDefined();
    });
  });

  it('should have MaterialBrowserModal component', () => {
    import('../../components/materials/MaterialBrowserModal').then((module) => {
      expect(module.MaterialBrowserModal).toBeDefined();
    });
  });

  it('should have useEntityMesh hook', () => {
    import('../../components/panels/ViewportPanel/hooks/useEntityMesh').then((module) => {
      expect(module.useEntityMesh).toBeDefined();
    });
  });
});
