import type { Middleware } from '@reduxjs/toolkit';

const STORAGE_KEY = 'chromagrade_layout';
const PERSIST_ACTIONS = [
  'ui/setLeftSidebarWidth',
  'ui/setRightSidebarWidth',
  'ui/setBottomPanelHeight'
];

export const persistMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  if (PERSIST_ACTIONS.includes(action.type)) {
    const state = (store.getState() as any).ui;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        leftSidebarWidth: state.leftSidebarWidth,
        rightSidebarWidth: state.rightSidebarWidth,
        bottomPanelHeight: state.bottomPanelHeight,
      }));
    } catch (e) {
      console.error('Failed to save layout to localStorage', e);
    }
  }

  return result;
};
