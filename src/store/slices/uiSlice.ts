import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeBottomTab: 'wheels' | 'curves' | 'hsl' | 'lut' | 'ai' | 'presets';
  zoom: number;
  showBeforeAfter: boolean;
  isExportModalOpen: boolean;
  isPickerActive: boolean;
  activeCurveChannel: 'master' | 'red' | 'green' | 'blue';
}

const initialState: UIState = {
  activeBottomTab: 'wheels',
  zoom: 1,
  showBeforeAfter: false,
  isExportModalOpen: false,
  isPickerActive: false,
  activeCurveChannel: 'master',
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
  },
});

export const { 
  setTab, 
  setZoom, 
  toggleBeforeAfter, 
  setExportModalOpen, 
  setPickerActive,
  setActiveCurveChannel
} = uiSlice.actions;

export default uiSlice.reducer;
