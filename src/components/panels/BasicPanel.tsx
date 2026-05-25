import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LayoutGrid } from "lucide-react";
import type { RootState } from "../../store/store";
import PerformanceSlider from "../ui/PerformanceSlider";
import {
  setExposure,
  setToneHighlights,
  setToneShadows,
  setWhites,
  setBlacks,
  setTexture,
  setClarity,
  setDehaze,
  setProfile,
  setBw,
  setHdr,
  setHdrLimit,
  setVisualizeHdr,
  setSdrPreview,
  setSdrBrightness,
  setSdrContrast,
  setSdrClarity,
  setSdrHighlights,
  setSdrShadows,
  setSdrWhites,
  setSdrHighlightSat,
  setWbPreset,
} from "../../store/slices/basicSlice";
import {
  setTemperature,
  setTint,
  setContrast,
  setSaturation,
  setVibrance,
} from "../../store/slices/gradingSlice";
import { canvasEngine } from "../../lib/CanvasEngine";
import { computeAutoWB } from "../../lib/autoWB";

const BasicPanel: React.FC = () => {
  const dispatch = useDispatch();
  const basic = useSelector((state: RootState) => state.basic);
  const grading = useSelector((state: RootState) => state.grading);

  const [sdrOpen, setSdrOpen] = useState(false);

  const handleWbPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "as-shot" | "auto" | "custom";
    if (val === "as-shot") {
      dispatch(setTemperature(0));
      dispatch(setTint(0));
      dispatch(setWbPreset("as-shot"));
    } else if (val === "auto") {
      const proxy = canvasEngine.getProxyImageData();
      if (!proxy) return;

      // TEMP DEBUG — remove after diagnosis
      const data = proxy.data;
      let sumR = 0,
        sumG = 0,
        sumB = 0;
      for (let i = 0; i < data.length; i += 4) {
        sumR += data[i];
        sumG += data[i + 1];
        sumB += data[i + 2];
      }
      const pc = data.length / 4;
      console.log("PROXY SIZE", proxy.width, proxy.height);
      console.log("RAW AVG RGB", { r: sumR / pc, g: sumG / pc, b: sumB / pc });

      const result = computeAutoWB(proxy);
      console.log("AUTO WB RESULT", result);

      dispatch(setTemperature(result.temperature));
      dispatch(setTint(result.tint));
      dispatch(setWbPreset("auto"));
    }
  };

  const SectionHeader: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <h3 className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-2 mt-4 px-3">
      {children}
    </h3>
  );

  return (
    <div className="flex flex-col pb-4">
      {/* Quick Actions Row */}
      <div className="flex justify-end gap-1 px-3 py-2 border-b border-[var(--border)]">
        <button className="px-4 py-1 rounded-sm text-[11px] font-medium border border-[var(--border)] hover:bg-[var(--bg-hover)]">
          Auto
        </button>
        <button
          onClick={() => {
            const next = !basic.bw;
            dispatch(setBw(next));
            dispatch(setProfile(next ? "Monochrome" : "Color"));
            dispatch(setSaturation(next ? -100 : 0));
          }}
          className={`px-4 py-1 rounded-sm text-[11px] font-medium border ${basic.bw ? "bg-[var(--bg-control)] border-[var(--text-secondary)]" : "border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}
        >
          B&W
        </button>
        <button
          onClick={() => dispatch(setHdr(!basic.hdr))}
          className={`px-4 py-1 rounded-sm text-[11px] font-medium border ${basic.hdr ? "bg-[var(--bg-control)] border-[var(--text-secondary)]" : "border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}
        >
          HDR
        </button>
      </div>

      {/* Profile Row */}
      <div className="flex items-center px-3 py-2 border-b border-[var(--border)]">
        <span className="text-[11px] text-[var(--text-secondary)] w-[72px] shrink-0">
          Profile :
        </span>
        <select
          value={basic.profile}
          onChange={(e) => {
            const mono = e.target.value === "Monochrome";
            dispatch(setProfile(e.target.value));
            dispatch(setBw(mono));
            dispatch(setSaturation(mono ? -100 : 0));
          }}
          className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] outline-none cursor-pointer"
        >
          <option value="Color">Color</option>
          <option value="Monochrome">Monochrome</option>
        </select>
        <button className="p-1 hover:bg-[var(--bg-hover)] rounded" title="Browse Profiles">
          <LayoutGrid size={14} />
        </button>
      </div>

      <div className="border-b border-[var(--border)] px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7" />
          <span className="text-[11px] text-[var(--text-secondary)] flex-1">
            WB :
          </span>
          <select
            value={basic.wbPreset}
            onChange={handleWbPreset}
            className="bg-transparent text-[11px] text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="as-shot">As Shot</option>
            <option value="auto">Auto</option>
            <option value="custom" disabled>
              Custom
            </option>
          </select>
        </div>

      <div className="space-y-3">
        <PerformanceSlider
          label="Temp"
          min={-100}
          max={100}
          value={grading.temperature}
          trackGradient="linear-gradient(to right, #4a90d9, #8b5cf6, #888, #d4a017, #f5a623)"
          showTicks={true}
          onChange={(v) => {
            dispatch(setTemperature(v));
            dispatch(setWbPreset("custom"));
          }}
          onReset={() => {
            dispatch(setTemperature(0));
            dispatch(setWbPreset("custom"));
          }}
        />
        <PerformanceSlider
          label="Tint"
          min={-100}
          max={100}
          value={grading.tint}
          trackGradient="linear-gradient(to right, #4caf50, #888, #e91e8c)"
          showTicks={true}
          onChange={(v) => {
            dispatch(setTint(v));
            dispatch(setWbPreset("custom"));
          }}
          onReset={() => {
            dispatch(setTint(0));
            dispatch(setWbPreset("custom"));
          }}
        />
      </div>
      </div>

      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)]">
        <span className="text-[11px] text-[var(--text-secondary)]">Tone</span>
      </div>
      <div className="px-3 py-2 space-y-2 border-b border-[var(--border)]">
        <PerformanceSlider
          label="Exposure"
          min={-5}
          max={5}
          step={0.01}
          value={basic.exposure}
          onChange={(v) => dispatch(setExposure(v))}
          onReset={() => dispatch(setExposure(0))}
        />
        <PerformanceSlider
          label="Contrast"
          min={-100}
          max={100}
          value={grading.contrast}
          onChange={(v) => dispatch(setContrast(v))}
          onReset={() => dispatch(setContrast(0))}
        />
      </div>
      <div className="px-3 py-2 space-y-2 border-b border-[var(--border)]">
        <PerformanceSlider
          label="Highlights"
          min={-100}
          max={100}
          value={basic.toneHighlights}
          onChange={(v) => dispatch(setToneHighlights(v))}
          onReset={() => dispatch(setToneHighlights(0))}
        />
        <PerformanceSlider
          label="Shadows"
          min={-100}
          max={100}
          value={basic.toneShadows}
          onChange={(v) => dispatch(setToneShadows(v))}
          onReset={() => dispatch(setToneShadows(0))}
        />
        <PerformanceSlider
          label="Whites"
          min={-100}
          max={100}
          value={basic.whites}
          onChange={(v) => dispatch(setWhites(v))}
          onReset={() => dispatch(setWhites(0))}
        />
        <PerformanceSlider
          label="Blacks"
          min={-100}
          max={100}
          value={basic.blacks}
          onChange={(v) => dispatch(setBlacks(v))}
          onReset={() => dispatch(setBlacks(0))}
        />
      </div>

      <div className="flex items-center justify-center py-1.5 border-b border-[var(--border)]">
        <span className="text-[11px] text-[var(--text-secondary)]">Presence</span>
      </div>
      <div
        className="px-3 py-2 space-y-2 border-b border-[var(--border)] opacity-60"
        title="Shader support coming soon"
      >
        <PerformanceSlider
          label="Texture"
          min={-100}
          max={100}
          value={basic.texture}
          onChange={(v) => dispatch(setTexture(v))}
          onReset={() => dispatch(setTexture(0))}
        />
        <PerformanceSlider
          label="Clarity"
          min={-100}
          max={100}
          value={basic.clarity}
          onChange={(v) => dispatch(setClarity(v))}
          onReset={() => dispatch(setClarity(0))}
        />
        <PerformanceSlider
          label="Dehaze"
          min={-100}
          max={100}
          value={basic.dehaze}
          onChange={(v) => dispatch(setDehaze(v))}
          onReset={() => dispatch(setDehaze(0))}
        />
      </div>

      <div className="px-3 py-2 space-y-2 border-b border-[var(--border)]">
        <PerformanceSlider
          label="Vibrance"
          min={-100}
          max={100}
          value={grading.vibrance}
          trackGradient="linear-gradient(to right, #888, #4caf50, #2196f3, #e91e8c, #f44336)"
          showTicks={true}
          onChange={(v) => dispatch(setVibrance(v))}
          onReset={() => dispatch(setVibrance(0))}
        />
        <PerformanceSlider
          label="Saturation"
          min={-100}
          max={100}
          value={grading.saturation}
          trackGradient="linear-gradient(to right, #888, #4caf50, #2196f3, #e91e8c, #f44336)"
          showTicks={true}
          onChange={(v) => dispatch(setSaturation(v))}
          onReset={() => dispatch(setSaturation(0))}
        />
      </div>

      {basic.hdr && (
        <div className="mt-4 opacity-60" title="Shader support coming soon">
          <SectionHeader>HDR</SectionHeader>
          <div className="px-3 space-y-3">
            <PerformanceSlider
              label="HDR Limit"
              min={0}
              max={10}
              value={basic.hdrLimit}
              onChange={(v) => dispatch(setHdrLimit(v))}
              onReset={() => dispatch(setHdrLimit(4))}
            />
            <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={basic.visualizeHdr}
                onChange={(e) => dispatch(setVisualizeHdr(e.target.checked))}
                className="accent-[var(--theme-primary)]"
              />
              Visualize HDR
            </label>

            <div className="border border-[var(--border)] rounded mt-2">
              <button
                onClick={() => setSdrOpen(!sdrOpen)}
                className="w-full text-left px-3 py-2 text-[10px] font-bold flex justify-between items-center hover:bg-[var(--bg-hover)]"
              >
                SDR Rendition Settings
                <span>{sdrOpen ? "▲" : "▼"}</span>
              </button>

              {sdrOpen && (
                <div className="p-3 border-t border-[var(--border)] space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] mb-2">
                    <input
                      type="checkbox"
                      checked={basic.sdrPreview}
                      onChange={(e) =>
                        dispatch(setSdrPreview(e.target.checked))
                      }
                      className="accent-[var(--theme-primary)]"
                    />
                    Preview for SDR Display
                  </label>
                  <PerformanceSlider
                    label="Brightness"
                    min={-100}
                    max={100}
                    value={basic.sdrBrightness}
                    onChange={(v) => dispatch(setSdrBrightness(v))}
                  />
                  <PerformanceSlider
                    label="Contrast"
                    min={-100}
                    max={100}
                    value={basic.sdrContrast}
                    onChange={(v) => dispatch(setSdrContrast(v))}
                  />
                  <PerformanceSlider
                    label="Clarity"
                    min={-100}
                    max={100}
                    value={basic.sdrClarity}
                    onChange={(v) => dispatch(setSdrClarity(v))}
                  />
                  <PerformanceSlider
                    label="Highlights"
                    min={-100}
                    max={100}
                    value={basic.sdrHighlights}
                    onChange={(v) => dispatch(setSdrHighlights(v))}
                  />
                  <PerformanceSlider
                    label="Shadows"
                    min={-100}
                    max={100}
                    value={basic.sdrShadows}
                    onChange={(v) => dispatch(setSdrShadows(v))}
                  />
                  <PerformanceSlider
                    label="Whites"
                    min={-100}
                    max={100}
                    value={basic.sdrWhites}
                    onChange={(v) => dispatch(setSdrWhites(v))}
                  />
                  <PerformanceSlider
                    label="Highlight Saturation"
                    min={-100}
                    max={100}
                    value={basic.sdrHighlightSat}
                    onChange={(v) => dispatch(setSdrHighlightSat(v))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicPanel;
