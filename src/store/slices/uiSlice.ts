import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeBottomTab: 'wheels' | 'curves' | 'hsl' | 'lut' | 'ai' | 'presets';
  zoom: number;
  showBeforeAfter: boolean;
  isExportModalOpen: boolean;
}

const initialState: UIState = {
  activeBottomTab: 'wheels',
  zoom: 1,
  showBeforeAfter: false,
  isExportModalOpen: false,
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
  },
});

export const { setTab, setZoom, toggleBeforeAfter, setExportModalOpen } = uiSlice.actions;

export default uiSlice.reducer;
