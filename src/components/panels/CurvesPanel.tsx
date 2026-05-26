import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { resetCurve, setCurvePoints } from "../../store/slices/gradingSlice";
import type { CurvesState } from "../../store/slices/gradingSlice";
import {
  setPickerActive,
  setActiveCurveChannel,
} from "../../store/slices/uiSlice";
import { RotateCcw, Copy, Target } from "lucide-react";
import CurveGraph from "../ui/CurveGraph";
import { canvasEngine } from "../../lib/CanvasEngine";
import { histogramGenerator } from "../../lib/HistogramGenerator";
import type { HistogramData } from "../../lib/HistogramGenerator";

const CurvesPanel: React.FC = () => {
  const dispatch = useDispatch();
  const curves = useSelector((state: RootState) => state.grading.curves);
  const isPickerActive = useSelector(
    (state: RootState) => state.ui.isPickerActive,
  );
  const activeChannel = useSelector(
    (state: RootState) => state.ui.activeCurveChannel,
  );
  const [histogramData, setHistogramData] = useState<HistogramData | null>(
    null,
  );

  // Periodic Histogram Update
  useEffect(() => {
    const updateHistogram = () => {
      const canvas = canvasEngine.getCanvas();
      if (canvas) {
        const data = histogramGenerator.generate(canvas);
        setHistogramData(data);
      }
    };

    const interval = setInterval(updateHistogram, 200); // 5fps for histogram is enough
    updateHistogram();

    return () => clearInterval(interval);
  }, []);

  const channels: { id: keyof CurvesState; label: string; color: string }[] = [
    { id: "master", label: "RGB", color: "var(--text-primary)" },
    { id: "red", label: "Red", color: "#ef4444" },
    { id: "green", label: "Green", color: "#22c55e" },
    { id: "blue", label: "Blue", color: "#3b82f6" },
  ];

  const handleCopyMasterToChannels = () => {
    const masterPoints = curves.master;
    ["red", "green", "blue"].forEach((ch) => {
      dispatch(
        setCurvePoints({
          channel: ch as keyof CurvesState,
          points: [...masterPoints],
        }),
      );
    });
  };

  return (
    <div className="flex flex-col pb-4 bg-[var(--bg-panel)] select-none">
      {/* Top Controller Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)]">
        {/* Channel Selection Tabs */}
        <div className="flex bg-[var(--bg-base)] rounded-md p-0.5 border border-[var(--border)] overflow-x-auto min-w-0">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => dispatch(setActiveCurveChannel(ch.id))}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight transition-all rounded-[4px] flex items-center shrink-0 ${
                activeChannel === ch.id
                  ? "bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 shrink-0"
                style={{
                  backgroundColor: ch.color,
                  opacity: activeChannel === ch.id ? 1 : 0.4,
                }}
              />
              {ch.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => dispatch(setPickerActive(!isPickerActive))}
            className={`p-1.5 rounded-md transition-all border ${
              isPickerActive
                ? "bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white"
                : "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="Targeted Adjustment Tool"
          >
            <Target size={13} />
          </button>
          <button
            onClick={() => dispatch(resetCurve(activeChannel))}
            className="p-1.5 bg-[var(--bg-base)] border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="Reset Current Curve"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Target Descriptor Label Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)] bg-[var(--bg-panel)]/30">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">
          {channels.find((c) => c.id === activeChannel)?.label} Curve
        </span>
      </div>

      {/* Main Graph Content Area */}
      <div className="px-3 py-3 flex flex-col gap-2">
        <div className="w-full aspect-square bg-black/40 rounded-lg border border-[var(--border)] relative overflow-hidden group max-w-[360px] mx-auto">
          <CurveGraph
            channel={activeChannel}
            points={curves[activeChannel]}
            isPickerActive={isPickerActive}
            histogramData={histogramData}
          />
        </div>

        {/* Graph Axes Reference Text */}
        <div className="flex justify-between items-center text-[9px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest px-1 max-w-[360px] w-full mx-auto">
          <span>Blacks</span>
          <span>Midtones</span>
          <span>Whites</span>
        </div>
      </div>

      {/* Utilities Section Stacked Vertically */}
      <div className="px-3 py-1 space-y-2">
        <div className="bg-[var(--bg-base)] rounded-lg border border-[var(--border)] p-2">
          <button
            onClick={handleCopyMasterToChannels}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[var(--bg-panel)] hover:bg-[var(--bg-control)] rounded-md border border-[var(--border)] text-[11px] transition-all group"
          >
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-[11px]">
              Copy RGB Curve to All Channels
            </span>
            <Copy size={12} className="text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>

      {/* Vertical Tooltips Footer */}
      <div className="mt-2 mx-3 pt-2 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          Tip: Double-click to add/remove curve anchor nodes. Drag paths close
          to the diagonal center line to clear or snap points.
        </p>
      </div>
    </div>
  );
};

export default CurvesPanel;
