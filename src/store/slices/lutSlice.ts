import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { LUT_DEFAULT_SIZE, LUT_STRENGTH_DEFAULT } from '../../lib/lut/lutConstants';

interface LutState {
  activeLut: string | null;
  strength: number;
  lutSize: number;
}

const initialState: LutState = {
  activeLut: null,
  strength: LUT_STRENGTH_DEFAULT,
  lutSize: LUT_DEFAULT_SIZE,
};

const lutSlice = createSlice({
  name: 'lut',
  initialState,
  reducers: {
    setActiveLut(state, action: PayloadAction<string | null>) {
      state.activeLut = action.payload;
    },
    setLutStrength(state, action: PayloadAction<number>) {
      state.strength = Math.max(0, Math.min(100, action.payload));
    },
    setLutSize(state, action: PayloadAction<number>) {
      state.lutSize = action.payload;
    },
  },
});

export const { setActiveLut, setLutStrength, setLutSize } = lutSlice.actions;
export default lutSlice.reducer;
