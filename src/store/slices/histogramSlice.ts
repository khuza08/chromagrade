import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface HistogramData {
  red: number[];
  green: number[];
  blue: number[];
  luma: number[];
}

interface HistogramState extends HistogramData {
  showShadowClipping: boolean;
  showHighlightClipping: boolean;
}

const initialState: HistogramState = {
  red: new Array(256).fill(0),
  green: new Array(256).fill(0),
  blue: new Array(256).fill(0),
  luma: new Array(256).fill(0),
  showShadowClipping: false,
  showHighlightClipping: false,
};

const histogramSlice = createSlice({
  name: 'histogram',
  initialState,
  reducers: {
    setHistogramData: (state, action: PayloadAction<HistogramData>) => {
      state.red = action.payload.red;
      state.green = action.payload.green;
      state.blue = action.payload.blue;
      state.luma = action.payload.luma;
    },
    toggleShadowClipping: (state) => {
      state.showShadowClipping = !state.showShadowClipping;
    },
    toggleHighlightClipping: (state) => {
      state.showHighlightClipping = !state.showHighlightClipping;
    },
  },
});

export const { setHistogramData, toggleShadowClipping, toggleHighlightClipping } = histogramSlice.actions;
export default histogramSlice.reducer;
