export const useSubmenuPosition = (
  rect: DOMRect,
  submenuItemCount: number,
): { left: number; top: number } => {
  const submenuWidth = 200;
  let left = rect.right + 4;
  let top = rect.top;

  // Check if submenu would go off right edge
  if (left + submenuWidth > window.innerWidth) {
    left = rect.left - submenuWidth - 4;
  }

  // Check if submenu would go off bottom edge
  const submenuHeight = submenuItemCount * 32 + 16;
  if (top + submenuHeight > window.innerHeight) {
    top = window.innerHeight - submenuHeight;
  }

  return { left, top };
};
