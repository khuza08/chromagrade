import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ExportFormat = 'jpg' | 'png' | 'gif';

interface ExportState {
  format: ExportFormat;
}

const initialState: ExportState = {
  format: 'png',
};

const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    setExportFormat: (state, action: PayloadAction<ExportFormat>) => {
      state.format = action.payload;
    },
  },
});

export const { setExportFormat } = exportSlice.actions;
export default exportSlice.reducer;
