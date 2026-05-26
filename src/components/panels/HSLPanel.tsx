import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RotateCcw } from "lucide-react";
import type { RootState } from "../../store/store";
import type { HSLState } from "../../store/slices/gradingSlice";
import { resetAllHSL, resetHSLChannel } from "../../store/slices/gradingSlice";
import { setHslViewMode, setActiveColorBin } from "../../store/slices/uiSlice";
import HSLHeaderDot from "../ui/HSLHeaderDot";
import HSLSlider from "../ui/HSLSlider";

const HSLPanel: React.FC = () => {
  const dispatch = useDispatch();
  const activeAttribute = useSelector(
    (state: RootState) => state.ui.activeHslAttribute,
  );
  const viewMode = useSelector((state: RootState) => state.ui.hslViewMode);
  const activeBinId = useSelector(
    (state: RootState) => state.ui.activeColorBin,
  );

  const colorBins: { id: keyof HSLState; label: string; hue: number }[] = [
    { id: "red", label: "Red", hue: 0 },
    { id: "orange", label: "Orange", hue: 30 },
    { id: "yellow", label: "Yellow", hue: 60 },
    { id: "green", label: "Green", hue: 120 },
    { id: "aqua", label: "Aqua", hue: 180 },
    { id: "blue", label: "Blue", hue: 240 },
    { id: "purple", label: "Purple", hue: 280 },
    { id: "magenta", label: "Magenta", hue: 320 },
  ];

  const attributeLabels = {
    hue: "Hue Shift",
    sat: "Saturation",
    lum: "Luminance",
  };

  const attributeKeys: Record<"hue" | "sat" | "lum", "h" | "s" | "l"> = {
    hue: "h",
    sat: "s",
    lum: "l",
  };

  const activeBin = colorBins.find((b) => b.id === activeBinId) || colorBins[0];

  const handleReset = () => {
    if (viewMode === "hsl") {
      dispatch(resetAllHSL());
    } else {
      dispatch(resetHSLChannel(activeBinId));
    }
  };

  return (
    <div className="flex flex-col pb-4 bg-[var(--bg-panel)] select-none">
      {/* Top Controller Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          {viewMode === "hsl" && (
            <div className="flex gap-1.5">
              <HSLHeaderDot attribute="hue" label="Hue" />
              <HSLHeaderDot attribute="sat" label="Sat" />
              <HSLHeaderDot attribute="lum" label="Lum" />
            </div>
          )}
          <button
            onClick={handleReset}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
            title={
              viewMode === "hsl" ? "Reset All HSL" : `Reset ${activeBin.label}`
            }
          >
            <RotateCcw
              size={13}
              className="group-active:rotate-[-90deg] transition-transform duration-200"
            />
          </button>
        </div>

        {/* HSL vs Color Sub-toggle */}
        <div className="flex items-center gap-2 bg-[var(--bg-control)] rounded-md px-2 py-0.5 border border-[var(--border)] shrink-0">
          <button
            onClick={() => dispatch(setHslViewMode("hsl"))}
            className={`text-[11px] font-medium transition-opacity ${viewMode === "hsl" ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)] opacity-60 hover:opacity-100"}`}
          >
            HSL
          </button>
          <div className="w-[1px] h-2.5 bg-[var(--border)]" />
          <button
            onClick={() => dispatch(setHslViewMode("color"))}
            className={`text-[11px] font-medium transition-opacity ${viewMode === "color" ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)] opacity-60 hover:opacity-100"}`}
          >
            Color
          </button>
        </div>
      </div>

      {/* Target Descriptor Label Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)] bg-[var(--bg-panel)]/30">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">
          {viewMode === "hsl"
            ? attributeLabels[activeAttribute as keyof typeof attributeLabels]
            : `${activeBin.label} Channel`}
        </span>
      </div>

      {/* Main Controls Wrapper */}
      <div className="px-3 py-2">
        {viewMode === "hsl" ? (
          /* Multi-color single attribute Stack */
          <div className="space-y-3">
            {colorBins.map((bin) => (
              <HSLSlider
                key={bin.id}
                channel={bin.id}
                type={
                  attributeKeys[activeAttribute as keyof typeof attributeKeys]
                }
                label={bin.label}
                hueDeg={bin.hue}
              />
            ))}
          </div>
        ) : (
          /* Single Color Multi-attribute Stack */
          <div className="flex flex-col gap-4">
            {/* Horizontal Color Picker Grid */}
            <div className="flex justify-center py-1">
              <div className="flex flex-wrap justify-center gap-1.5 bg-[var(--bg-control)] p-1.5 border border-[var(--border)] rounded-md">
                {colorBins.map((bin) => (
                  <button
                    key={bin.id}
                    onClick={() => dispatch(setActiveColorBin(bin.id))}
                    className={`w-4 h-4 rounded-sm transition-all transform duration-100 active:scale-95 ${
                      activeBinId === bin.id
                        ? "ring-2 ring-white scale-110 shadow-md"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: `hsl(${bin.hue}, 85%, 45%)` }}
                    title={bin.label}
                    aria-label={bin.label}
                  />
                ))}
              </div>
            </div>

            {/* HSL Triple sliders */}
            <div className="space-y-3 pt-1 border-t border-[var(--border)]/50">
              {(["h", "s", "l"] as const).map((t) => (
                <HSLSlider
                  key={`${activeBinId}-${t}`}
                  channel={activeBinId}
                  type={t}
                  label={
                    t === "h" ? "Hue" : t === "s" ? "Saturation" : "Luminance"
                  }
                  hueDeg={activeBin.hue}
                  singleColorMode
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vertical Tooltips Footer */}
      <div className="mt-2 mx-3 pt-2 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed italic">
          {viewMode === "hsl"
            ? "Tip: Drag vertically over your active viewport to sample and modulate mixes on the fly."
            : "Fine-tune structural hue, local saturation weights, and brightness metrics for this tone."}
        </p>
      </div>
    </div>
  );
};

export default HSLPanel;
