import { configureStore } from '@reduxjs/toolkit';
import gradingReducer from './slices/gradingSlice';
import historyReducer from './slices/historySlice';
import imageReducer from './slices/imageSlice';
import uiReducer from './slices/uiSlice';
import exportReducer from './slices/exportSlice';
import { historyMiddleware } from './middleware/historyMiddleware';

export const store = configureStore({
  reducer: {
    grading: gradingReducer,
    history: historyReducer,
    image: imageReducer,
    ui: uiReducer,
    export: exportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(historyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
