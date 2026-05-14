import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const STORAGE_KEY = 'chromagrade_layout';
const PERSIST_ACTIONS = [
  'ui/setLeftSidebarWidth',
  'ui/setRightSidebarWidth',
  'ui/setBottomPanelHeight'
];

export const persistMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
  const result = next(action);

  if (PERSIST_ACTIONS.includes(action.type)) {
    const state = store.getState().ui;
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
