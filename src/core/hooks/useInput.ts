import { useEffect } from 'react';
import { create } from 'zustand';

// Define action names
export type InputAction =
  | 'moveForward'
  | 'moveLeft'
  | 'moveBackward'
  | 'moveRight'
  | 'jump'
  | 'lookUp'
  | 'lookDown'
  | 'lookLeft'
  | 'lookRight'
  | 'fire';

// Example input map: maps raw keys to actions
const inputMap: Record<string, InputAction> = {
  w: 'moveForward',
  a: 'moveLeft',
  s: 'moveBackward',
  d: 'moveRight',
  ' ': 'jump',
  ArrowUp: 'lookUp',
  ArrowDown: 'lookDown',
  ArrowLeft: 'lookLeft',
  ArrowRight: 'lookRight',
  Mouse0: 'fire',
};

// Zustand store for input state
interface IInputState {
  actions: Partial<Record<InputAction, boolean>>;
  setAction: (action: InputAction, state: boolean) => void;
}

const useInputStore = create<IInputState>((set) => ({
  actions: {},
  setAction: (action, state) =>
    set((s) => ({
      actions: { ...s.actions, [action]: state },
    })),
}));

// Helper to get action from event
function getActionFromEvent(e: KeyboardEvent | MouseEvent): InputAction | undefined {
  if (e.type.startsWith('mouse')) {
    if ('button' in e && e.button === 0) return inputMap['Mouse0'];
    // Add more mouse buttons if needed
    return undefined;
  }
  if ('key' in e) return inputMap[e.key];
  return undefined;
}

export function useInput() {
  const actions = useInputStore((s) => s.actions);
  const setAction = useInputStore((s) => s.setAction);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const action = getActionFromEvent(e);
      if (action) setAction(action, true);
    }
    function handleKeyUp(e: KeyboardEvent) {
      const action = getActionFromEvent(e);
      if (action) setAction(action, false);
    }
    function handleMouseDown(e: MouseEvent) {
      const action = getActionFromEvent(e);
      if (action) setAction(action, true);
    }
    function handleMouseUp(e: MouseEvent) {
      const action = getActionFromEvent(e);
      if (action) setAction(action, false);
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setAction]);

  // API: isPressed(action), getActions()
  return {
    isPressed: (action: InputAction) => !!actions[action],
    actions,
  };
}
