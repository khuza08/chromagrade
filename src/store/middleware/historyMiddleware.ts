import type { Middleware } from '@reduxjs/toolkit';
import { pushSnapshot } from '../slices/historySlice';

export const historyMiddleware: Middleware = store => next => action => {
  // Only intercept grading actions that change the state (excluding reset and applySnapshot)
  const actionType = (action as any).type || '';
  const isGradingAction = actionType.startsWith('grading/') && 
                         actionType !== 'grading/applySnapshot' &&
                         actionType !== 'grading/resetGrading';

  if (isGradingAction) {
    const state = store.getState() as any;
    // Save current state to history before it gets updated
    if (state.grading) {
      store.dispatch(pushSnapshot(state.grading));
    }
  }

  return next(action);
};
