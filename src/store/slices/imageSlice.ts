import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ImageState {
  originalUrl: string | null;
  dimensions: { width: number; height: number } | null;
  fileName: string | null;
  previewWarning: string | null;
}

const initialState: ImageState = {
  originalUrl: null,
  dimensions: null,
  fileName: null,
  previewWarning: null,
};

export const imageSlice = createSlice({
  name: 'image',
  initialState,
  reducers: {
    setImage: (state, action: PayloadAction<{ url: string; width: number; height: number; name: string; previewWarning?: string | null }>) => {
      state.originalUrl = action.payload.url;
      state.dimensions = { width: action.payload.width, height: action.payload.height };
      state.fileName = action.payload.name;
      state.previewWarning = action.payload.previewWarning ?? null;
    },
    clearImage: () => initialState,
  },
});

export const { setImage, clearImage } = imageSlice.actions;

export default imageSlice.reducer;
