/**
 * historyUtils.ts
 * Helper to capture a full HistorySnapshot from the live Redux store.
 * Use this in component event handlers BEFORE dispatching compound operations
 * (preset apply, LUT apply/clear) to manually create a history entry.
 *
 * Usage:
 *   import { captureSnapshot } from '../../utils/historyUtils';
 *   import { pushSnapshot } from '../../store/slices/historySlice';
 *
 *   dispatch(pushSnapshot(captureSnapshot()));
 *   dispatch(applyPartialSnapshot(preset.parameters));
 *   dispatch(setActivePresetId(preset.id));
 */
import { store } from '../store/store';
import type { HistorySnapshot } from '../store/slices/historySlice';

export function captureSnapshot(): HistorySnapshot {
  const state = store.getState() as any;
  return {
    grading: state.grading,
    basic: state.basic,
    lut: state.lut,
  };
}
