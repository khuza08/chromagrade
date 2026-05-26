import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  setContrast,
  setSaturation,
  setTemperature,
  setTint,
  setVibrance,
  setPrimaryWheel,
  resetPrimaryWheel,
} from "../../store/slices/gradingSlice";
import type { PrimaryWheels } from "../../store/slices/gradingSlice";
import PerformanceSlider from "../ui/PerformanceSlider";
import ColorWheel from "../ui/ColorWheel";

const WheelsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const grading = useSelector((state: RootState) => state.grading);

  // Controls state for focusing on an individual wheel vs seeing all stacked
  const [activeTab, setActiveTab] = useState<"all" | keyof PrimaryWheels>(
    "all",
  );

  const wheelConfigs: { key: keyof PrimaryWheels; label: string }[] = [
    { key: "shadows", label: "Shadows" },
    { key: "midtones", label: "Midtones" },
    { key: "highlights", label: "Highlights" },
    { key: "global", label: "Global" },
  ];

  return (
    <div className="flex flex-col pb-4 bg-[var(--bg-panel)] select-none">
      {/* Top Controller Actions Row / Wheel Picker Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)]">
        <div className="flex bg-[var(--bg-base)] rounded-md p-0.5 border border-[var(--border)] overflow-x-auto min-w-0 w-full justify-between">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase tracking-tight transition-all rounded-[4px] text-center ${
              activeTab === "all"
                ? "bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All
          </button>
          <div className="w-[1px] h-3 my-auto bg-[var(--border)]" />
          {wheelConfigs.map((config) => (
            <button
              key={config.key}
              onClick={() => setActiveTab(config.key)}
              className={`flex-1 px-1.5 py-1 text-[10px] font-bold uppercase tracking-tight transition-all rounded-[4px] text-center ${
                activeTab === config.key
                  ? "bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {config.label.slice(0, 3)}{" "}
              {/* Compact text (Sha, Mid, Hig, Glo) */}
            </button>
          ))}
        </div>
      </div>

      {/* Target Descriptor Label Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)] bg-[var(--bg-panel)]/30">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">
          {activeTab === "all"
            ? "Color Grading Wheels"
            : `${activeTab.toUpperCase()} WHEEL`}
        </span>
      </div>

      {/* Wheels Container Area */}
      <div className="px-3 py-4 border-b border-[var(--border)]">
        {activeTab === "all" ? (
          /* Multi-Wheel Layout: Stacked for compact sidebars, shifts to 2-col if expanded */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 max-w-[340px] sm:max-w-none mx-auto w-full">
            {wheelConfigs.map((config) => (
              <div key={config.key} className="flex justify-center w-full">
                <ColorWheel
                  label={config.label}
                  value={grading.primary[config.key]}
                  onChange={(val) =>
                    dispatch(setPrimaryWheel({ wheel: config.key, ...val }))
                  }
                  onReset={() => dispatch(resetPrimaryWheel(config.key))}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Isolated Focus Wheel View */
          <div className="flex justify-center w-full py-2">
            <ColorWheel
              label={wheelConfigs.find((w) => w.key === activeTab)!.label}
              value={grading.primary[activeTab]}
              onChange={(val) =>
                dispatch(setPrimaryWheel({ wheel: activeTab, ...val }))
              }
              onReset={() => dispatch(resetPrimaryWheel(activeTab))}
            />
          </div>
        )}
      </div>

      {/* Secondary Global Tuning Parameters Section Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)] bg-[var(--bg-panel)]/10">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">
          Global Settings
        </span>
      </div>

      {/* Performance Sliders Stack List */}
      <div className="px-3 py-2 space-y-2">
        <PerformanceSlider
          label="Contrast"
          min={-100}
          max={100}
          value={grading.contrast}
          onChange={(v) => dispatch(setContrast(v))}
          onReset={() => dispatch(setContrast(0))}
        />
        <PerformanceSlider
          label="Saturation"
          min={-100}
          max={100}
          value={grading.saturation}
          onChange={(v) => dispatch(setSaturation(v))}
          onReset={() => dispatch(setSaturation(0))}
        />
        <PerformanceSlider
          label="Temp"
          min={-100}
          max={100}
          value={grading.temperature}
          trackGradient="linear-gradient(to right, #4a90d9, #8b5cf6, #888, #d4a017, #f5a623)"
          showTicks={true}
          onChange={(v) => dispatch(setTemperature(v))}
          onReset={() => dispatch(setTemperature(0))}
        />
        <PerformanceSlider
          label="Tint"
          min={-100}
          max={100}
          value={grading.tint}
          trackGradient="linear-gradient(to right, #4caf50, #888, #e91e8c)"
          showTicks={true}
          onChange={(v) => dispatch(setTint(v))}
          onReset={() => dispatch(setTint(0))}
        />
        <PerformanceSlider
          label="Vibrance"
          min={-100}
          max={100}
          value={grading.vibrance}
          onChange={(v) => dispatch(setVibrance(v))}
          onReset={() => dispatch(setVibrance(0))}
        />
      </div>

      {/* Vertical Tooltips Footer */}
      <div className="mt-2 mx-3 pt-2 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          Tip: Drag the wheel reticle outward to increase color saturation. Hold
          down Shift to lock hue angles while altering weight parameters.
        </p>
      </div>
    </div>
  );
};

export default WheelsPanel;
