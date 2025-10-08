import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SidebarModal } from '../SidebarModal';

describe('SidebarModal', () => {
  const mockSections = [
    {
      id: 'section1',
      label: 'Section 1',
      content: <div>Section 1 Content</div>,
    },
    {
      id: 'section2',
      label: 'Section 2',
      content: <div>Section 2 Content</div>,
    },
    {
      id: 'section3',
      label: 'Section 3',
      content: <div>Section 3 Content</div>,
    },
  ];

  it('does not render when isOpen is false', () => {
    render(
      <SidebarModal isOpen={false} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <SidebarModal isOpen={true} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('renders all section labels in sidebar', () => {
    render(
      <SidebarModal isOpen={true} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Section 3')).toBeInTheDocument();
  });

  it('renders default section content', () => {
    render(
      <SidebarModal isOpen={true} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    expect(screen.getByText('Section 1 Content')).toBeInTheDocument();
  });

  it('renders specified default section', () => {
    render(
      <SidebarModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        sections={mockSections}
        defaultSectionId="section2"
      />,
    );

    expect(screen.getByText('Section 2 Content')).toBeInTheDocument();
    expect(screen.queryByText('Section 1 Content')).not.toBeInTheDocument();
  });

  it('switches sections when clicking sidebar buttons', async () => {
    const user = userEvent.setup();

    render(
      <SidebarModal isOpen={true} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    expect(screen.getByText('Section 1 Content')).toBeInTheDocument();

    await user.click(screen.getByText('Section 2'));

    expect(screen.getByText('Section 2 Content')).toBeInTheDocument();
    expect(screen.queryByText('Section 1 Content')).not.toBeInTheDocument();

    await user.click(screen.getByText('Section 3'));

    expect(screen.getByText('Section 3 Content')).toBeInTheDocument();
    expect(screen.queryByText('Section 2 Content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <SidebarModal
        isOpen={true}
        onClose={handleClose}
        title="Test Modal"
        sections={mockSections}
      />,
    );

    const closeButton = screen.getByTitle('Close');
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer actions when provided', () => {
    const footerActions = (
      <>
        <button>Cancel</button>
        <button>Save</button>
      </>
    );

    render(
      <SidebarModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        sections={mockSections}
        footerActions={footerActions}
      />,
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not render footer when no actions provided', () => {
    const { container } = render(
      <SidebarModal isOpen={true} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    const footer = container.querySelector('.border-t');
    expect(footer).not.toBeInTheDocument();
  });

  it('renders sections with icons', () => {
    const sectionsWithIcons = [
      {
        id: 'section1',
        label: 'Section 1',
        icon: <span data-testid="icon-1">🔧</span>,
        content: <div>Content 1</div>,
      },
      {
        id: 'section2',
        label: 'Section 2',
        icon: <span data-testid="icon-2">⚙️</span>,
        content: <div>Content 2</div>,
      },
    ];

    render(
      <SidebarModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        sections={sectionsWithIcons}
      />,
    );

    expect(screen.getByTestId('icon-1')).toBeInTheDocument();
    expect(screen.getByTestId('icon-2')).toBeInTheDocument();
  });

  it('applies correct width class', () => {
    const { container } = render(
      <SidebarModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        sections={mockSections}
        width="2xl"
      />,
    );

    const modal = container.querySelector('.max-w-2xl');
    expect(modal).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(
      <SidebarModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        sections={mockSections}
        height="90vh"
      />,
    );

    const modal = container.querySelector('[style*="max-height: 90vh"]');
    expect(modal).toBeInTheDocument();
  });

  it('highlights active section button', async () => {
    const user = userEvent.setup();

    render(
      <SidebarModal isOpen={true} onClose={vi.fn()} title="Test Modal" sections={mockSections} />,
    );

    const section1Button = screen.getByText('Section 1').closest('button');
    const section2Button = screen.getByText('Section 2').closest('button');

    expect(section1Button).toHaveClass('bg-cyan-600');
    expect(section2Button).not.toHaveClass('bg-cyan-600');

    await user.click(section2Button!);

    expect(section2Button).toHaveClass('bg-cyan-600');
    expect(section1Button).not.toHaveClass('bg-cyan-600');
  });
});
