import type { Middleware } from '@reduxjs/toolkit';
import { addPreset, deletePreset, importPresets } from '../slices/presetsSlice';

const LAYOUT_STORAGE_KEY = 'chromagrade_layout';
const PRESET_STORAGE_KEY = 'chromagrade_user_presets';

const LAYOUT_ACTIONS = [
  'ui/setLeftSidebarWidth',
  'ui/setRightSidebarWidth',
  'ui/setBottomPanelHeight'
];

const PRESET_ACTIONS = [
  addPreset.type,
  deletePreset.type,
  importPresets.type
];

export const persistMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  if (LAYOUT_ACTIONS.includes(action.type)) {
    const state = (store.getState() as any).ui;
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({
        leftSidebarWidth: state.leftSidebarWidth,
        rightSidebarWidth: state.rightSidebarWidth,
        bottomPanelHeight: state.bottomPanelHeight,
      }));
    } catch (e) {
      console.error('Failed to save layout to localStorage', e);
    }
  }

  if (PRESET_ACTIONS.includes(action.type)) {
    const state = (store.getState() as any).presets;
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(state.userPresets));
    } catch (e) {
      console.error('Failed to save user presets to localStorage', e);
    }
  }

  return result;
};
