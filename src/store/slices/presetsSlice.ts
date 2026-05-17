import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GradingState } from './gradingSlice';

export interface Preset {
  id: string;
  name: string;
  category: string;
  parameters: Partial<GradingState>;
}

interface PresetsState {
  prebuiltPresets: Preset[];
  userPresets: Preset[];
}

const prebuiltPresets: Preset[] = [
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    category: 'Cinematic',
    parameters: {
      temperature: 15,
      tint: -5,
      contrast: 15,
      saturation: 10,
    }
  },
  {
    id: 'vintage-fade',
    name: 'Vintage Fade',
    category: 'Vintage',
    parameters: {
      contrast: -10,
      saturation: -15,
      temperature: 5,
    }
  },
  {
    id: 'monochrome',
    name: 'Monochrome High',
    category: 'B&W',
    parameters: {
      saturation: -100,
      contrast: 25,
    }
  },
  {
    id: 'cool-nordic',
    name: 'Cool Nordic',
    category: 'Cinematic',
    parameters: {
      temperature: -20,
      tint: 5,
      contrast: 5,
      saturation: -5,
    }
  }
];

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
      localStorage.setItem('chromagrade_user_presets', JSON.stringify(state.userPresets));
    },
    deletePreset: (state, action: PayloadAction<string>) => {
      state.userPresets = state.userPresets.filter(p => p.id !== action.payload);
      localStorage.setItem('chromagrade_user_presets', JSON.stringify(state.userPresets));
    },
    importPresets: (state, action: PayloadAction<Preset[]>) => {
      // Avoid duplicate IDs
      const existingIds = new Set(state.userPresets.map(p => p.id));
      const newPresets = action.payload.filter(p => !existingIds.has(p.id));
      state.userPresets.push(...newPresets);
      localStorage.setItem('chromagrade_user_presets', JSON.stringify(state.userPresets));
    }
  }
});

export const { addPreset, deletePreset, importPresets } = presetsSlice.actions;
export default presetsSlice.reducer;
