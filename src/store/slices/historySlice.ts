import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GradingState } from './gradingSlice';
import type { BasicState } from './basicSlice';
import type { LutState } from './lutSlice';
import type { PresetsState } from './presetsSlice';

// Combined snapshot capturing all relevant slices for undo/redo
export interface HistorySnapshot {
  grading: GradingState;
  basic: BasicState;
  lut: LutState;
  presets: PresetsState;
}

interface HistoryState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
}

const initialState: HistoryState = {
  past: [],
  future: [],
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushSnapshot: (state, action: PayloadAction<HistorySnapshot>) => {
      state.past.push(action.payload);
      if (state.past.length > 50) {
        state.past.shift();
      }
      state.future = [];
    },
    undo: (state, action: PayloadAction<HistorySnapshot>) => {
      const previous = state.past.pop();
      if (previous) {
        state.future.unshift(action.payload);
      }
    },
    redo: (state, action: PayloadAction<HistorySnapshot>) => {
      const next = state.future.shift();
      if (next) {
        state.past.push(action.payload);
      }
    },
    resetHistory: () => initialState,
  },
});

export const { pushSnapshot, undo, redo, resetHistory } = historySlice.actions;

export default historySlice.reducer;
