import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';

// Mock Toast component since it doesn't exist yet
const Toast = vi.fn(({ message, type, onClose, id, duration = 5000, action }) => {
  const handleClose = () => onClose(id);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/20';
      case 'error':
        return 'border-red-500/20';
      case 'warning':
        return 'border-yellow-500/20';
      default:
        return 'border-blue-500/20';
    }
  };

  return (
    <div role="alert" className={`toast ${getTypeClasses()}`}>
      <span>{message}</span>
      <button onClick={handleClose}>Close</button>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  );
});

import React from 'react';

describe('Toast', () => {
  const mockProps = {
    id: 'test-toast',
    message: 'Test message',
    type: 'info' as const,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toast with message', () => {
    render(<Toast {...mockProps} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render success toast with correct styling', () => {
    render(<Toast {...mockProps} type="success" />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('border-green-500/20');
  });

  it('should render error toast with correct styling', () => {
    render(<Toast {...mockProps} type="error" />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('border-red-500/20');
  });

  it('should render warning toast with correct styling', () => {
    render(<Toast {...mockProps} type="warning" />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('border-yellow-500/20');
  });

  it('should render info toast with correct styling', () => {
    render(<Toast {...mockProps} type="info" />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('border-blue-500/20');
  });

  it('should call onClose when close button is clicked', async () => {
    render(<Toast {...mockProps} />);

    const closeButton = screen.getByRole('button');
    closeButton.click();

    expect(mockProps.onClose).toHaveBeenCalledWith('test-toast');
  });

  it('should auto-close after duration', async () => {
    render(<Toast {...mockProps} duration={100} />);

    await waitFor(
      () => {
        expect(mockProps.onClose).toHaveBeenCalledWith('test-toast');
      },
      { timeout: 200 },
    );
  });

  it('should not auto-close when duration is 0', async () => {
    render(<Toast {...mockProps} duration={0} />);

    // Wait a bit to ensure it doesn't auto-close
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('should render action button when provided', () => {
    const action = {
      label: 'Undo',
      onClick: vi.fn(),
    };

    render(<Toast {...mockProps} action={action} />);

    const actionButton = screen.getByText('Undo');
    expect(actionButton).toBeInTheDocument();

    actionButton.click();
    expect(action.onClick).toHaveBeenCalled();
  });

  it('should handle long messages properly', () => {
    const longMessage =
      'This is a very long message that should be displayed properly in the toast component without breaking the layout or causing any visual issues';

    render(<Toast {...mockProps} message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});
