/**
 * Editor Focus Guard Hook
 * Detects text input contexts (including Monaco editor) to prevent global shortcuts
 * from interfering with typing.
 */

export interface IEditorFocusGuard {
  isTextInputActive: () => boolean;
  shouldHandleGlobalShortcut: (event: KeyboardEvent) => boolean;
}

/**
 * Hook to detect if the user is typing in a text input field
 * Prevents global keyboard shortcuts from firing while typing in Monaco or other text fields
 */
export const useEditorFocusGuard = (): IEditorFocusGuard => {
  const isTextInputActive = () => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;

    // Check for standard input elements
    if (active instanceof HTMLInputElement) return true;
    if (active instanceof HTMLTextAreaElement) return true;

    // Check for contentEditable elements
    if (active.isContentEditable) return true;

    // Check if we're inside Monaco editor
    if (active.closest('.monaco-editor')) return true;

    return false;
  };

  const shouldHandleGlobalShortcut = () => !isTextInputActive();

  return { isTextInputActive, shouldHandleGlobalShortcut };
};
