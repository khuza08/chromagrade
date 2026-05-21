import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GradingState } from './gradingSlice';
import type { ImageStats, ColorTransferResult } from '../../lib/colorTransfer';

export type ModalStatus = 'idle' | 'analyzing' | 'ready' | 'applying' | 'error';

export interface ColorTransferState {
  isOpen: boolean;
  status: ModalStatus;
  errorMessage: string | null;
  referenceImageUrl: string | null;       // object URL for thumbnail display only
  referenceStats: ImageStats | null;
  baseStats: ImageStats | null;
  baseGrading: GradingState | null;       // deep-cloned snapshot on modal open
  transferResult: ColorTransferResult | null;
  strength: number;                       // 0.0 to 1.0, default 0.7
}

const initialState: ColorTransferState = {
  isOpen: false,
  status: 'idle',
  errorMessage: null,
  referenceImageUrl: null,
  referenceStats: null,
  baseStats: null,
  baseGrading: null,
  transferResult: null,
  strength: 0.7,
};

export const colorTransferSlice = createSlice({
  name: 'colorTransfer',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<GradingState>) => {
      state.isOpen = true;
      state.status = 'idle';
      state.errorMessage = null;
      state.referenceImageUrl = null;
      state.referenceStats = null;
      state.baseStats = null;
      state.baseGrading = JSON.parse(JSON.stringify(action.payload));
      state.transferResult = null;
      state.strength = 0.7;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.status = 'idle';
      state.errorMessage = null;
      state.referenceImageUrl = null;
      state.referenceStats = null;
      state.baseStats = null;
      state.baseGrading = null;
      state.transferResult = null;
      state.strength = 0.7;
    },
    setReferenceStats: (state, action: PayloadAction<{ url: string; stats: ImageStats }>) => {
      state.referenceImageUrl = action.payload.url;
      state.referenceStats = action.payload.stats;
      if (state.baseStats) {
        state.status = 'ready';
      }
    },
    setBaseStats: (state, action: PayloadAction<ImageStats>) => {
      state.baseStats = action.payload;
      if (state.referenceStats) {
        state.status = 'ready';
      }
    },
    setTransferResult: (state, action: PayloadAction<ColorTransferResult>) => {
      state.transferResult = action.payload;
    },
    setStrength: (state, action: PayloadAction<number>) => {
      state.strength = action.payload;
    },
    setStatus: (state, action: PayloadAction<ModalStatus>) => {
      state.status = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
      state.status = 'error';
    },
  },
});

export const {
  openModal,
  closeModal,
  setReferenceStats,
  setBaseStats,
  setTransferResult,
  setStrength,
  setStatus,
  setError,
} = colorTransferSlice.actions;

export default colorTransferSlice.reducer;
