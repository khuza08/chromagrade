import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface WheelValue {
  x: number;      // -1.0 to 1.0 (Color balance X)
  y: number;      // -1.0 to 1.0 (Color balance Y)
  luma: number;   // 0.0 to 2.0 (Neutral at 1.0)
}

export interface PrimaryWheels {
  shadows: WheelValue;
  midtones: WheelValue;
  highlights: WheelValue;
  global: WheelValue;
}

export interface CurvePoint {
  x: number;      // 0.0 to 1.0
  y: number;      // 0.0 to 1.0
}

export interface CurvesState {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface GradingState {
  primary: PrimaryWheels;
  contrast: number;
  pivot: number;
  saturation: number;
  temperature: number;
  tint: number;
  curves: CurvesState;
}

const initialWheel: WheelValue = { x: 0, y: 0, luma: 1.0 };
const initialCurve: CurvePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];

const initialState: GradingState = {
  primary: {
    shadows: { ...initialWheel },
    midtones: { ...initialWheel },
    highlights: { ...initialWheel },
    global: { ...initialWheel },
  },
  contrast: 0,
  pivot: 0.5,
  saturation: 0,
  temperature: 0,
  tint: 0,
  curves: {
    master: [...initialCurve],
    red: [...initialCurve],
    green: [...initialCurve],
    blue: [...initialCurve],
  },
};

export const gradingSlice = createSlice({
  name: 'grading',
  initialState,
  reducers: {
    setPrimaryWheel: (
      state,
      action: PayloadAction<{ wheel: keyof PrimaryWheels; x?: number; y?: number; luma?: number }>
    ) => {
      const { wheel, ...values } = action.payload;
      state.primary[wheel] = { ...state.primary[wheel], ...values };
    },
    resetPrimaryWheel: (state, action: PayloadAction<keyof PrimaryWheels>) => {
      state.primary[action.payload] = { ...initialWheel };
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
    setCurvePoints: (
      state,
      action: PayloadAction<{ channel: keyof CurvesState; points: CurvePoint[] }>
    ) => {
      const { channel, points } = action.payload;
      state.curves[channel] = points;
    },
    resetCurve: (state, action: PayloadAction<keyof CurvesState>) => {
      state.curves[action.payload] = [...initialCurve];
    },
    resetGrading: () => initialState,
    applySnapshot: (_, action: PayloadAction<GradingState>) => action.payload,
  },
});

export const {
  setPrimaryWheel,
  resetPrimaryWheel,
  setContrast,
  setPivot,
  setSaturation,
  setTemperature,
  setTint,
  setCurvePoints,
  resetCurve,
  resetGrading,
  applySnapshot,
} = gradingSlice.actions;

export default gradingSlice.reducer;
