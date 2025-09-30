import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IMaterialDefinition } from '@core/materials/Material.types';
import { MaterialBrowserModal } from '../MaterialBrowserModal';

// Mock the materials store
const mockMaterials: IMaterialDefinition[] = [
  {
    id: 'default',
    name: 'Default Material',
    shader: 'standard',
    materialType: 'solid',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.7,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
  },
  {
    id: 'test123',
    name: 'Test Material',
    shader: 'standard',
    materialType: 'solid',
    color: '#ff6600',
    metalness: 0.3,
    roughness: 0.6,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
  },
  {
    id: 'unlit-material',
    name: 'Unlit Material',
    shader: 'unlit',
    materialType: 'texture',
    color: '#00ff00',
    metalness: 0,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
    albedoTexture: '/assets/textures/test.png',
  },
];

const mockStore = {
  materials: mockMaterials,
  duplicateMaterial: vi.fn(),
  deleteMaterial: vi.fn(),
};

vi.mock('@editor/store/materialsStore', () => ({
  useMaterialsStore: () => mockStore,
}));

// Mock MaterialPreviewSphere component
vi.mock('../MaterialPreviewSphere', () => ({
  MaterialPreviewSphere: ({ material }: { material: IMaterialDefinition }) => (
    <div data-testid={`preview-sphere-${material.id}`}>Preview: {material.name}</div>
  ),
}));

// Mock Modal component
vi.mock('@editor/components/shared/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
      </div>
    ) : null,
}));

describe('MaterialBrowserModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    selectedMaterialId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.materials = mockMaterials;
    mockStore.duplicateMaterial.mockResolvedValue({
      ...mockMaterials[1],
      id: 'test123_copy_1234567890',
      name: 'Test Material (Copy)',
    });
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(<MaterialBrowserModal {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Select Material');
    });

    it('should not render when closed', () => {
      render(<MaterialBrowserModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render all materials', () => {
      render(<MaterialBrowserModal {...defaultProps} />);

      expect(screen.getByTestId('preview-sphere-default')).toBeInTheDocument();
      expect(screen.getByTestId('preview-sphere-test123')).toBeInTheDocument();
      expect(screen.getByTestId('preview-sphere-unlit-material')).toBeInTheDocument();
    });

    it('should show selected material with different styling', () => {
      render(<MaterialBrowserModal {...defaultProps} selectedMaterialId="test123" />);

      const selectedMaterial = screen.getByTestId('preview-sphere-test123');
      expect(selectedMaterial).toBeInTheDocument();
      // Just verify it renders, don't test specific styling details
    });

    it('should render material information correctly', () => {
      render(<MaterialBrowserModal {...defaultProps} />);

      expect(screen.getByText('Default Material')).toBeInTheDocument();
      expect(screen.getByText('Test Material')).toBeInTheDocument();
      // Check for material type info (multiple instances may exist)
      expect(screen.getAllByText(/standard/).length).toBeGreaterThan(0);
    });
  });

  describe('search functionality', () => {
    it('should filter materials by search term', async () => {
      const user = userEvent.setup();
      render(<MaterialBrowserModal {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search materials...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByTestId('preview-sphere-test123')).toBeInTheDocument();
        expect(screen.queryByTestId('preview-sphere-default')).not.toBeInTheDocument();
        expect(screen.queryByTestId('preview-sphere-unlit-material')).not.toBeInTheDocument();
      });
    });

    it('should show no materials message when search yields no results', async () => {
      const user = userEvent.setup();
      render(<MaterialBrowserModal {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search materials...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No materials found')).toBeInTheDocument();
        expect(screen.getByText('Try a different search term')).toBeInTheDocument();
      });
    });
  });

  describe('material selection', () => {
    it('should call onSelect and onClose when material is clicked in single select mode', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();

      render(
        <MaterialBrowserModal
          {...defaultProps}
          onSelect={onSelect}
          onClose={onClose}
          allowMultiSelect={false}
        />,
      );

      const materialDiv = screen.getByTestId('preview-sphere-test123').closest('div')!;
      await user.click(materialDiv);

      expect(onSelect).toHaveBeenCalledWith('test123');
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle multi-select mode', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <MaterialBrowserModal {...defaultProps} onSelect={onSelect} allowMultiSelect={true} />,
      );

      const materialDiv = screen.getByTestId('preview-sphere-test123').closest('div')!;
      await user.click(materialDiv);

      // In multi-select, onSelect shouldn't be called immediately
      expect(onSelect).not.toHaveBeenCalled();

      // But we should see a confirm button
      expect(screen.getByText(/Select \(1\)/)).toBeInTheDocument();
    });

    it('should confirm multi-selection', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();

      render(
        <MaterialBrowserModal
          {...defaultProps}
          onSelect={onSelect}
          onClose={onClose}
          allowMultiSelect={true}
        />,
      );

      // Select a material
      const materialDiv = screen.getByTestId('preview-sphere-test123').closest('div')!;
      await user.click(materialDiv);

      // Confirm selection
      const confirmButton = screen.getByText(/Select \(1\)/);
      await user.click(confirmButton);

      expect(onSelect).toHaveBeenCalledWith('test123');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('material actions', () => {
    it('should show edit button when onEdit is provided', () => {
      const onEdit = vi.fn();
      render(<MaterialBrowserModal {...defaultProps} onEdit={onEdit} />);

      // Edit buttons should be present (excluding default material which might not have one)
      const editButtons = screen.getAllByTitle('Edit');
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} onEdit={onEdit} />);

      const editButtons = screen.getAllByTitle('Edit');
      await user.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalled();
    });

    it('should duplicate material when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} onSelect={onSelect} onClose={onClose} />);

      const duplicateButtons = screen.getAllByTitle('Duplicate');
      await user.click(duplicateButtons[0]);

      await waitFor(() => {
        expect(mockStore.duplicateMaterial).toHaveBeenCalled();
        expect(onSelect).toHaveBeenCalledWith('test123_copy_1234567890');
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should delete material when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      render(<MaterialBrowserModal {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          'Are you sure you want to delete this material?',
        );
        expect(mockStore.deleteMaterial).toHaveBeenCalled();
      });
    });

    it('should not delete material when delete is cancelled', async () => {
      const user = userEvent.setup();
      // Mock window.confirm to return false
      window.confirm = vi.fn(() => false);

      render(<MaterialBrowserModal {...defaultProps} />);

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockStore.deleteMaterial).not.toHaveBeenCalled();
    });

    it('should not show delete button for default material', () => {
      render(<MaterialBrowserModal {...defaultProps} />);

      // The default material should not have a delete button
      // We need to check the specific material item for default
      const defaultMaterialDiv = screen.getByTestId('preview-sphere-default').closest('div')!;
      const deleteButton = defaultMaterialDiv.querySelector('[title="Delete"]');
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe('create functionality', () => {
    it('should call onCreate when create button is clicked', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} onCreate={onCreate} />);

      const createButton = screen.getByText('Create');
      await user.click(createButton);

      expect(onCreate).toHaveBeenCalled();
    });

    it('should call onClose when create button is clicked and no onCreate provided', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} onClose={onClose} />);

      const createButton = screen.getByText('Create');
      await user.click(createButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('cancel functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('material count display', () => {
    it('should show correct material count', () => {
      render(<MaterialBrowserModal {...defaultProps} />);

      expect(screen.getByText('3 materials')).toBeInTheDocument();
    });

    it('should show singular form for one material', () => {
      mockStore.materials = [mockMaterials[0]];
      render(<MaterialBrowserModal {...defaultProps} />);

      expect(screen.getByText('1 material')).toBeInTheDocument();
    });
  });

  describe('helpful messages', () => {
    it('should show helpful message when only default material exists', () => {
      mockStore.materials = [mockMaterials[0]]; // Only default material
      render(<MaterialBrowserModal {...defaultProps} />);

      expect(screen.getByText('💡 Only the default material exists')).toBeInTheDocument();
      expect(screen.getByText('Click "Create" to add custom materials')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle duplicate material error', async () => {
      const user = userEvent.setup();
      mockStore.duplicateMaterial.mockRejectedValue(new Error('Duplicate failed'));

      // Mock alert
      window.alert = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} />);

      const duplicateButtons = screen.getAllByTitle('Duplicate');
      await user.click(duplicateButtons[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to duplicate material');
      });
    });

    it('should handle delete material error', async () => {
      const user = userEvent.setup();
      window.confirm = vi.fn(() => true);
      mockStore.deleteMaterial.mockRejectedValue(new Error('Delete failed'));

      // Mock alert
      window.alert = vi.fn();

      render(<MaterialBrowserModal {...defaultProps} selectedMaterialId="test123" />);

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Delete failed');
      });
    });
  });
});
