import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GradingState } from './gradingSlice';

interface HistoryState {
  past: GradingState[];
  future: GradingState[];
}

const initialState: HistoryState = {
  past: [],
  future: [],
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushSnapshot: (state, action: PayloadAction<GradingState>) => {
      state.past.push(action.payload);
      if (state.past.length > 50) {
        state.past.shift();
      }
      state.future = [];
    },
    undo: (state, action: PayloadAction<GradingState>) => {
      const previous = state.past.pop();
      if (previous) {
        state.future.unshift(action.payload);
      }
    },
    redo: (state, action: PayloadAction<GradingState>) => {
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
