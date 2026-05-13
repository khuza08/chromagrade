import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { HSLState } from './gradingSlice';

interface UIState {
  activeBottomTab: 'wheels' | 'curves' | 'hsl' | 'lut' | 'ai' | 'presets';
  zoom: number;
  showBeforeAfter: boolean;
  isExportModalOpen: boolean;
  isPickerActive: boolean;
  activeCurveChannel: 'master' | 'red' | 'green' | 'blue';
  activeHslAttribute: 'hue' | 'sat' | 'lum';
  isHslTargetActive: boolean;
  hslWeights: Record<string, number>;
  hslViewMode: 'hsl' | 'color';
  activeColorBin: keyof HSLState;
}

const initialState: UIState = {
  activeBottomTab: 'wheels',
  zoom: 1,
  showBeforeAfter: false,
  isExportModalOpen: false,
  isPickerActive: false,
  activeCurveChannel: 'master',
  activeHslAttribute: 'sat',
  isHslTargetActive: false,
  hslWeights: {},
  hslViewMode: 'hsl',
  activeColorBin: 'red',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTab: (state, action: PayloadAction<UIState['activeBottomTab']>) => {
      state.activeBottomTab = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    toggleBeforeAfter: (state) => {
      state.showBeforeAfter = !state.showBeforeAfter;
    },
    setExportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isExportModalOpen = action.payload;
    },
    setPickerActive: (state, action: PayloadAction<boolean>) => {
      state.isPickerActive = action.payload;
    },
    setActiveCurveChannel: (state, action: PayloadAction<UIState['activeCurveChannel']>) => {
      state.activeCurveChannel = action.payload;
    },
    setActiveHslAttribute: (state, action: PayloadAction<UIState['activeHslAttribute']>) => {
      state.activeHslAttribute = action.payload;
    },
    setHslTargetActive: (state, action: PayloadAction<boolean>) => {
      state.isHslTargetActive = action.payload;
      if (!action.payload) state.hslWeights = {};
    },
    setHslWeights: (state, action: PayloadAction<Record<string, number>>) => {
      state.hslWeights = action.payload;
    },
    setHslViewMode: (state, action: PayloadAction<UIState['hslViewMode']>) => {
      state.hslViewMode = action.payload;
    },
    setActiveColorBin: (state, action: PayloadAction<UIState['activeColorBin']>) => {
      state.activeColorBin = action.payload;
    },
  },
});

export const { 
  setTab, 
  setZoom, 
  toggleBeforeAfter, 
  setExportModalOpen, 
  setPickerActive,
  setActiveCurveChannel,
  setActiveHslAttribute,
  setHslTargetActive,
  setHslWeights,
  setHslViewMode,
  setActiveColorBin
} = uiSlice.actions;

export default uiSlice.reducer;
