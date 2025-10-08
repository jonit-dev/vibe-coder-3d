import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KeyboardInput } from '../KeyboardInput';

describe('KeyboardInput', () => {
  let keyboardInput: KeyboardInput;

  beforeEach(() => {
    keyboardInput = new KeyboardInput();
  });

  afterEach(() => {
    keyboardInput.destroy();
  });

  describe('Key down state', () => {
    it('should detect key down', () => {
      const event = new KeyboardEvent('keydown', { key: 'w' });
      window.dispatchEvent(event);

      expect(keyboardInput.isKeyDown('w')).toBe(true);
    });

    it('should normalize key names', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      window.dispatchEvent(event);

      expect(keyboardInput.isKeyDown('up')).toBe(true);
    });

    it('should normalize space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);

      expect(keyboardInput.isKeyDown('space')).toBe(true);
    });

    it('should be case insensitive', () => {
      const event = new KeyboardEvent('keydown', { key: 'W' });
      window.dispatchEvent(event);

      expect(keyboardInput.isKeyDown('w')).toBe(true);
      expect(keyboardInput.isKeyDown('W')).toBe(true);
    });
  });

  describe('Key pressed this frame', () => {
    it('should detect key pressed on first frame', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event);

      expect(keyboardInput.isKeyPressed('a')).toBe(true);
    });

    it('should not detect key pressed if already down', () => {
      const event1 = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event1);

      // Simulate frame clear
      keyboardInput.clearFrameState();

      const event2 = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event2);

      expect(keyboardInput.isKeyPressed('a')).toBe(false);
      expect(keyboardInput.isKeyDown('a')).toBe(true);
    });

    it('should clear pressed state after frame', () => {
      const event = new KeyboardEvent('keydown', { key: 'b' });
      window.dispatchEvent(event);

      expect(keyboardInput.isKeyPressed('b')).toBe(true);

      keyboardInput.clearFrameState();

      expect(keyboardInput.isKeyPressed('b')).toBe(false);
      expect(keyboardInput.isKeyDown('b')).toBe(true);
    });
  });

  describe('Key released this frame', () => {
    it('should detect key released', () => {
      const downEvent = new KeyboardEvent('keydown', { key: 'c' });
      window.dispatchEvent(downEvent);

      const upEvent = new KeyboardEvent('keyup', { key: 'c' });
      window.dispatchEvent(upEvent);

      expect(keyboardInput.isKeyReleased('c')).toBe(true);
      expect(keyboardInput.isKeyDown('c')).toBe(false);
    });

    it('should clear released state after frame', () => {
      const downEvent = new KeyboardEvent('keydown', { key: 'd' });
      window.dispatchEvent(downEvent);

      const upEvent = new KeyboardEvent('keyup', { key: 'd' });
      window.dispatchEvent(upEvent);

      expect(keyboardInput.isKeyReleased('d')).toBe(true);

      keyboardInput.clearFrameState();

      expect(keyboardInput.isKeyReleased('d')).toBe(false);
    });
  });

  describe('Multiple keys', () => {
    it('should track multiple keys simultaneously', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));

      expect(keyboardInput.isKeyDown('w')).toBe(true);
      expect(keyboardInput.isKeyDown('a')).toBe(true);
      expect(keyboardInput.isKeyDown('s')).toBe(true);
      expect(keyboardInput.isKeyDown('d')).toBe(false);
    });
  });

  describe('Window blur', () => {
    it('should clear all keys on window blur', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

      expect(keyboardInput.isKeyDown('w')).toBe(true);
      expect(keyboardInput.isKeyDown('a')).toBe(true);

      window.dispatchEvent(new Event('blur'));

      expect(keyboardInput.isKeyDown('w')).toBe(false);
      expect(keyboardInput.isKeyDown('a')).toBe(false);
      expect(keyboardInput.isKeyPressed('w')).toBe(false);
      expect(keyboardInput.isKeyPressed('a')).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      keyboardInput.destroy();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));

      expect(keyboardInput.isKeyDown('e')).toBe(false);
    });
  });
});
