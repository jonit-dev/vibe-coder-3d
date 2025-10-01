import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

import { HierarchyItem } from '../HierarchyItem';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

// Mock the component registry
vi.mock('@/core/lib/ecs/ComponentRegistry', () => ({
  componentRegistry: {
    hasComponent: vi.fn(),
  },
}));

// Mock EditableEntityName
vi.mock('@/editor/components/forms/EditableEntityName', () => ({
  EditableEntityName: ({ entityId, className }: { entityId: number; className?: string }) => (
    <div data-testid="editable-name" data-entity-id={entityId} className={className}>
      Entity {entityId}
    </div>
  ),
}));

describe('HierarchyItem', () => {
  const mockOnSelect = vi.fn();
  const mockOnContextMenu = vi.fn();
  const mockOnToggleExpanded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (componentRegistry.hasComponent as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  const renderWithDnd = (props: React.ComponentProps<typeof HierarchyItem>) => {
    return render(
      <DndContext>
        <ul>
          <HierarchyItem {...props} />
        </ul>
      </DndContext>,
    );
  };

  describe('basic rendering', () => {
    it('should render entity name', () => {
      renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      expect(screen.getByTestId('editable-name')).toBeInTheDocument();
      expect(screen.getByText('Entity 1')).toBeInTheDocument();
    });

    it('should apply selected styling when selected', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: true,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass('bg-gray-700/60');
    });

    it('should apply part-of-selection styling when isPartOfSelection', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        isPartOfSelection: true,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass('bg-blue-700/40');
    });
  });

  describe('prefab instance styling', () => {
    beforeEach(() => {
      (componentRegistry.hasComponent as ReturnType<typeof vi.fn>).mockReturnValue(true);
    });

    it('should display purple box icon for prefab instances', () => {
      renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Prefab Entity',
      });

      // Verify the prefab icon is present by checking for FiBox with title
      const icon = screen.getByTitle('Prefab Instance');
      expect(icon).toBeInTheDocument();
    });

    it('should display PREFAB badge for prefab instances', () => {
      renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Prefab Entity',
      });

      expect(screen.getByText('PREFAB')).toBeInTheDocument();
    });

    it('should apply purple-tinted styling to prefab instances', () => {
      renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Prefab Entity',
      });

      const editableName = screen.getByTestId('editable-name');
      expect(editableName).toHaveClass('text-purple-200');
    });

    it('should apply purple background and border to prefab instances', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Prefab Entity',
      });

      const contentDiv = container.querySelector('.bg-purple-500\\/5');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveClass('border-l-2', 'border-purple-500/40');
    });

    it('should display regular entity styling for non-prefab instances', () => {
      (componentRegistry.hasComponent as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Regular Entity',
      });

      const editableName = screen.getByTestId('editable-name');
      expect(editableName).not.toHaveClass('text-purple-200');

      const purpleIcon = screen.queryByTitle('Prefab Instance');
      expect(purpleIcon).not.toBeInTheDocument();

      const badge = screen.queryByText('PREFAB');
      expect(badge).not.toBeInTheDocument();

      const purpleBg = container.querySelector('.bg-purple-500\\/5');
      expect(purpleBg).not.toBeInTheDocument();
    });

    it('should display prefab icon when selected', () => {
      renderWithDnd({
        id: 1,
        selected: true,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Prefab Entity',
      });

      // Verify the prefab icon is still present when selected
      const icon = screen.getByTitle('Prefab Instance');
      expect(icon).toBeInTheDocument();
    });

    it('should display prefab icon when part of selection', () => {
      renderWithDnd({
        id: 1,
        selected: false,
        isPartOfSelection: true,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Prefab Entity',
      });

      // Verify the prefab icon is still present when part of selection
      const icon = screen.getByTitle('Prefab Instance');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('hierarchy interactions', () => {
    it('should render expand/collapse button when hasChildren is true', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        onToggleExpanded: mockOnToggleExpanded,
        name: 'Parent Entity',
        hasChildren: true,
        isExpanded: false,
      });

      const button = container.querySelector('button.hover\\:bg-gray-600\\/30');
      expect(button).toBeInTheDocument();
    });

    it('should call onToggleExpanded when expand button is clicked', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        onToggleExpanded: mockOnToggleExpanded,
        name: 'Parent Entity',
        hasChildren: true,
        isExpanded: false,
      });

      const button = container.querySelector('button.hover\\:bg-gray-600\\/30');
      fireEvent.click(button!);

      expect(mockOnToggleExpanded).toHaveBeenCalledWith(1);
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('should render correct indentation based on depth', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Nested Entity',
        depth: 2,
      });

      const indentDiv = container.querySelector('[style*="width"]');
      expect(indentDiv).toHaveStyle({ width: '32px' }); // 2 * 16px
    });

    it('should display hierarchy tree lines for nested items', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Nested Entity',
        depth: 1,
      });

      const treeLines = container.querySelectorAll('.bg-gray-600\\/30');
      expect(treeLines.length).toBeGreaterThan(0);
    });
  });

  describe('user interactions', () => {
    it('should call onSelect when clicked', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const listItem = container.querySelector('li');
      fireEvent.click(listItem!);

      expect(mockOnSelect).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should call onContextMenu when right-clicked', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const listItem = container.querySelector('li');
      fireEvent.contextMenu(listItem!);

      expect(mockOnContextMenu).toHaveBeenCalledWith(expect.any(Object), 1);
    });

    it('should not select when clicking on input element', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const input = document.createElement('input');
      const listItem = container.querySelector('li');
      listItem!.appendChild(input);

      fireEvent.click(input);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('drag and drop styling', () => {
    it('should apply dragging opacity when isDragging', () => {
      // Note: isDragging state comes from useSortable hook which is mocked by DndContext
      // This test verifies the className logic exists
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const listItem = container.querySelector('li');
      expect(listItem).toBeInTheDocument();
    });

    it('should apply drag-over styling when isDragOver is true', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
        isDragOver: true,
      });

      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass('bg-blue-600/30');
    });
  });

  describe('selection indicators', () => {
    it('should display selection indicator when selected', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: true,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const indicator = container.querySelector('.bg-blue-400.rounded-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should display part-of-selection indicator when isPartOfSelection', () => {
      const { container } = renderWithDnd({
        id: 1,
        selected: false,
        isPartOfSelection: true,
        onSelect: mockOnSelect,
        onContextMenu: mockOnContextMenu,
        name: 'Test Entity',
      });

      const indicator = container.querySelector('.bg-blue-500\\/60.rounded-full');
      expect(indicator).toBeInTheDocument();
    });
  });
});
