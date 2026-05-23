import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GradingState } from './gradingSlice';
import type { BasicState } from './basicSlice';
import { prebuiltPresets } from '../../data/presets/builtinPresets';

export interface Preset {
  id: string;
  name: string;
  category: string;
  parameters: Partial<GradingState>;
  basicParameters?: Partial<BasicState>;
}

interface PresetsState {
  prebuiltPresets: Preset[];
  userPresets: Preset[];
}

const loadUserPresets = (): Preset[] => {
  try {
    const saved = localStorage.getItem('chromagrade_user_presets');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load user presets', e);
    return [];
  }
};

const initialState: PresetsState = {
  prebuiltPresets,
  userPresets: loadUserPresets(),
};

export const presetsSlice = createSlice({
  name: 'presets',
  initialState,
  reducers: {
    addPreset: (state, action: PayloadAction<Preset>) => {
      state.userPresets.push(action.payload);
    },
    deletePreset: (state, action: PayloadAction<string>) => {
      state.userPresets = state.userPresets.filter(p => p.id !== action.payload);
    },
    importPresets: (state, action: PayloadAction<Preset[]>) => {
      // Avoid duplicate IDs
      const existingIds = new Set(state.userPresets.map(p => p.id));
      const newPresets = action.payload.filter(p => !existingIds.has(p.id));
      state.userPresets.push(...newPresets);
    }
  }
});

export const { addPreset, deletePreset, importPresets } = presetsSlice.actions;
export default presetsSlice.reducer;
