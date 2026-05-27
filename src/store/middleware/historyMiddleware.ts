import type { Middleware } from '@reduxjs/toolkit';
import { pushSnapshot } from '../slices/historySlice';
import type { HistorySnapshot } from '../slices/historySlice';

let lastActionType: string | null = null;
let lastActionTime: number = 0;

/**
 * History middleware — tracks ONLY simple single-field slider changes.
 * Compound operations (preset apply, LUT apply/clear) must push snapshots
 * manually from the component using captureSnapshot() + dispatch(pushSnapshot(...)).
 *
 * Tracked:
 *   - basic/* (excluding Snapshot and reset actions)
 *   - grading/* (excluding Snapshot and reset actions)
 *   - lut/setLutStrength (the strength slider only)
 *
 * NOT tracked (handled manually or skipped intentionally):
 *   - presets/* (compound: snapshot pushed manually in panels)
 *   - lut/setActiveLut, lut/setLutSize (compound: snapshot pushed manually)
 *   - lut/applyLutSnapshot, grading/applySnapshot, etc. (undo/redo restore actions)
 *   - resetGrading, resetBasic (Reset button calls resetHistory() to clear anyway)
 */
export const historyMiddleware: Middleware = store => next => action => {
  const actionType = (action as any).type || '';

  const isTrackedAction = (
    actionType.startsWith('basic/') ||
    actionType.startsWith('grading/') ||
    actionType === 'lut/setLutStrength'
  ) &&
    !actionType.includes('Snapshot') &&  // blocks all *Snapshot actions
    !actionType.includes('reset');       // blocks resetGrading, resetBasic

  if (isTrackedAction) {
    const now = Date.now();
    const isSameType = actionType === lastActionType;
    const isRapid = now - lastActionTime < 500; // 500ms debounce for slider drags

    if (!(isSameType && isRapid)) {
      const state = store.getState() as any;

      const snapshot: HistorySnapshot = {
        grading: state.grading,
        basic: state.basic,
        lut: state.lut,
        presets: state.presets,
      };

      store.dispatch(pushSnapshot(snapshot));
    }

    lastActionType = actionType;
    lastActionTime = now;
  }

  return next(action);
};
