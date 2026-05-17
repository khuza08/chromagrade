import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CurvePoint {
  x: number;
  y: number;
}

export interface CurvesState {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

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

export interface HSLValues {
  h: number;      // -1.0 to 1.0 (Hue shift)
  s: number;      // -1.0 to 1.0 (Saturation delta)
  l: number;      // -1.0 to 1.0 (Luminance delta)
}

export interface HSLState {
  red: HSLValues;
  orange: HSLValues;
  yellow: HSLValues;
  green: HSLValues;
  aqua: HSLValues;
  blue: HSLValues;
  purple: HSLValues;
  magenta: HSLValues;
}

export interface GradingState {
  primary: PrimaryWheels;
  contrast: number;
  pivot: number;
  saturation: number;
  temperature: number;
  tint: number;
  curves: CurvesState;
  hsl: HSLState;
}

const initialWheel: WheelValue = { x: 0, y: 0, luma: 1.0 };
const initialCurve: CurvePoint[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
const initialHSL: HSLValues = { h: 0, s: 0, l: 0 };

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
  hsl: {
    red: { ...initialHSL },
    orange: { ...initialHSL },
    yellow: { ...initialHSL },
    green: { ...initialHSL },
    aqua: { ...initialHSL },
    blue: { ...initialHSL },
    purple: { ...initialHSL },
    magenta: { ...initialHSL },
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
    setHSLChannel: (
      state,
      action: PayloadAction<{ channel: keyof HSLState; h?: number; s?: number; l?: number }>
    ) => {
      const { channel, ...values } = action.payload;
      state.hsl[channel] = { ...state.hsl[channel], ...values };
    },
    resetHSLChannel: (state, action: PayloadAction<keyof HSLState>) => {
      state.hsl[action.payload] = { ...initialHSL };
    },
    resetAllHSL: (state) => {
      state.hsl = { ...initialState.hsl };
    },
    resetGrading: () => initialState,
    applySnapshot: (_, action: PayloadAction<GradingState>) => action.payload,
    applyPartialSnapshot: (state, action: PayloadAction<Partial<GradingState>>) => {
      Object.assign(state, initialState);
      const payload = action.payload;
      if (payload.contrast !== undefined) state.contrast = payload.contrast;
      if (payload.pivot !== undefined) state.pivot = payload.pivot;
      if (payload.saturation !== undefined) state.saturation = payload.saturation;
      if (payload.temperature !== undefined) state.temperature = payload.temperature;
      if (payload.tint !== undefined) state.tint = payload.tint;
      if (payload.primary) {
        state.primary = { ...state.primary, ...payload.primary };
      }
      if (payload.curves) {
        state.curves = { ...state.curves, ...payload.curves };
      }
      if (payload.hsl) {
        state.hsl = { ...state.hsl, ...payload.hsl };
      }
    },
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
  setHSLChannel,
  resetHSLChannel,
  resetAllHSL,
  resetGrading,
  applySnapshot,
  applyPartialSnapshot,
} = gradingSlice.actions;

export default gradingSlice.reducer;
