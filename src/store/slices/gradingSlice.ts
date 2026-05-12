import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface PrimaryWheels {
  lift: { r: number; g: number; b: number; y: number };
  gamma: { r: number; g: number; b: number; y: number };
  gain: { r: number; g: number; b: number; y: number };
  offset: { r: number; g: number; b: number; y: number };
}

export interface GradingState {
  primary: PrimaryWheels;
  contrast: number;
  pivot: number;
  saturation: number;
  temperature: number;
  tint: number;
}

const initialState: GradingState = {
  primary: {
    lift: { r: 0, g: 0, b: 0, y: 0 },
    gamma: { r: 0, g: 0, b: 0, y: 0 },
    gain: { r: 0, g: 0, b: 0, y: 0 },
    offset: { r: 0, g: 0, b: 0, y: 0 },
  },
  contrast: 0,
  pivot: 0.5,
  saturation: 0,
  temperature: 0,
  tint: 0,
};

export const gradingSlice = createSlice({
  name: 'grading',
  initialState,
  reducers: {
    setPrimaryWheel: (
      state,
      action: PayloadAction<{ wheel: keyof PrimaryWheels; r?: number; g?: number; b?: number; y?: number }>
    ) => {
      const { wheel, ...values } = action.payload;
      state.primary[wheel] = { ...state.primary[wheel], ...values };
    },
    setContrast: (state, action: PayloadAction<number>) => {
      state.contrast = action.payload;
    },
    setPivot: (state, action: PayloadAction<number>) => {
      state.pivot = action.payload;
    },
    setSaturation: (state, action: PayloadAction<number>) => {
      state.saturation = action.payload;
    },
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload;
    },
    setTint: (state, action: PayloadAction<number>) => {
      state.tint = action.payload;
    },
    resetGrading: () => initialState,
    applySnapshot: (_, action: PayloadAction<GradingState>) => action.payload,
  },
});

export const {
  setPrimaryWheel,
  setContrast,
  setPivot,
  setSaturation,
  setTemperature,
  setTint,
  resetGrading,
  applySnapshot,
} = gradingSlice.actions;

export default gradingSlice.reducer;
