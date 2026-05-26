import React from "react";
import {
  BarChart2,
  Activity,
  Circle,
  Sliders,
  Pipette,
  Palette,
  Sparkles,
  Map,
  SlidersHorizontal,
} from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import EmptyStateOverlay from "../ui/EmptyStateOverlay";
import AccordionSection from "../ui/AccordionSection";
import Histogram from "../ui/Histogram";
import WheelsPanel from "../panels/WheelsPanel";
import CurvesPanel from "../panels/CurvesPanel";
import HSLPanel from "../panels/HSLPanel";
import IDPresetsPanel from "../panels/IDPresetsPanel";
import BasicPanel from "../panels/BasicPanel";
import LUTPanel from "../panels/LUTPanel";

const ComingSoon = () => (
  <div className="p-4 text-sm text-[var(--text-secondary)] italic">
    Coming soon...
  </div>
);

const RightSidebar: React.FC = () => {
  const width = "var(--right-sidebar-width)";
  const hasImage = useSelector(
    (state: RootState) => Boolean(state.image.originalUrl),
    (a, b) => a === b,
  );

  return (
    <div
      className="relative bg-[var(--bg-panel)] border-[var(--border)] flex flex-col transition-all duration-300 overflow-hidden"
      style={{ width }}
      {...(!hasImage ? { inert: true } : {})}
    >
      <EmptyStateOverlay />
      <div className="flex-1 overflow-y-auto">
        <AccordionSection title="Histogram" icon={BarChart2} defaultOpen>
          <div className="p-4">
            <Histogram />
          </div>
        </AccordionSection>
        <AccordionSection title="Basic" icon={SlidersHorizontal}>
          <BasicPanel />
        </AccordionSection>
        <AccordionSection title="Color Wheels" icon={Circle}>
          <WheelsPanel />
        </AccordionSection>
        <AccordionSection title="Curves" icon={Sliders}>
          <CurvesPanel />
        </AccordionSection>
        <AccordionSection title="HSL" icon={Pipette}>
          <HSLPanel />
        </AccordionSection>
        <AccordionSection title="LUT" icon={Palette}>
          <LUTPanel />
        </AccordionSection>
        <AccordionSection title="AI Grade" icon={Sparkles}>
          <ComingSoon />
        </AccordionSection>
        <AccordionSection title="Presets" icon={Map}>
          <IDPresetsPanel />
        </AccordionSection>
      </div>
    </div>
  );
};

export default RightSidebar;
