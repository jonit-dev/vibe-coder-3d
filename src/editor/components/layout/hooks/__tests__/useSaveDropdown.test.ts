import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useSaveDropdown } from '../useSaveDropdown';

describe('useSaveDropdown', () => {
  it('should initialize with isOpen as false', () => {
    const { result } = renderHook(() => useSaveDropdown());
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle isOpen when toggle is called', () => {
    const { result } = renderHook(() => useSaveDropdown());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should set isOpen to true when open is called', () => {
    const { result } = renderHook(() => useSaveDropdown());

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should set isOpen to false when close is called', () => {
    const { result } = renderHook(() => useSaveDropdown());

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
