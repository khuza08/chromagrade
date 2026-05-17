import { configureStore } from '@reduxjs/toolkit';
import gradingReducer from './slices/gradingSlice';
import historyReducer from './slices/historySlice';
import imageReducer from './slices/imageSlice';
import uiReducer from './slices/uiSlice';
import exportReducer from './slices/exportSlice';
import histogramReducer from './slices/histogramSlice';
import presetsReducer from './slices/presetsSlice';
import { historyMiddleware } from './middleware/historyMiddleware';
import { persistMiddleware } from './middleware/persistMiddleware';

export const store = configureStore({
  reducer: {
    grading: gradingReducer,
    history: historyReducer,
    image: imageReducer,
    ui: uiReducer,
    export: exportReducer,
    histogram: histogramReducer,
    presets: presetsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(historyMiddleware, persistMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
