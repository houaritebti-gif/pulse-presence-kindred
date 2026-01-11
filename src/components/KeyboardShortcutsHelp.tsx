// Keyboard shortcuts are now handled invisibly via useKeyboardShortcuts hook
// This component is kept for backwards compatibility but renders nothing
// Shortcuts work automatically on desktop (Alt+1-5 for navigation, Escape to close)
export const KeyboardShortcutsHelp = () => {
  // No visible UI - shortcuts work in the background via useKeyboardShortcuts
  return null;
};
