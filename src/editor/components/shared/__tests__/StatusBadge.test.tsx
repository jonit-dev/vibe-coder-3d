import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FiActivity } from 'react-icons/fi';

import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  describe('rendering', () => {
    it('should render with label and icon', () => {
      render(<StatusBadge icon={FiActivity} label="Ready" />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should render with default cyan variant', () => {
      const { container } = render(<StatusBadge icon={FiActivity} label="Test" />);
      const badge = container.querySelector('.bg-cyan-950\\/30');
      expect(badge).toBeInTheDocument();
    });

    it('should render with green variant when specified', () => {
      const { container } = render(<StatusBadge icon={FiActivity} label="Test" variant="green" />);
      const badge = container.querySelector('.bg-green-950\\/30');
      expect(badge).toBeInTheDocument();
    });

    it('should render with purple variant when specified', () => {
      const { container } = render(<StatusBadge icon={FiActivity} label="Test" variant="purple" />);
      const badge = container.querySelector('.bg-purple-950\\/30');
      expect(badge).toBeInTheDocument();
    });

    it('should render with yellow variant when specified', () => {
      const { container } = render(<StatusBadge icon={FiActivity} label="Test" variant="yellow" />);
      const badge = container.querySelector('.bg-yellow-950\\/30');
      expect(badge).toBeInTheDocument();
    });

    it('should render with red variant when specified', () => {
      const { container } = render(<StatusBadge icon={FiActivity} label="Test" variant="red" />);
      const badge = container.querySelector('.bg-red-950\\/30');
      expect(badge).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatusBadge icon={FiActivity} label="Test" className="custom-class" />,
      );
      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });
  });
});
