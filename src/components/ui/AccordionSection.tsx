import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AccordionSectionProps {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, icon: Icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border)]">
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-hover)] select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Icon size={12} className="text-[var(--text-secondary)]" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">{title}</span>
        </div>
        <ChevronDown
          size={12}
          className="text-[var(--text-secondary)] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

export default AccordionSection;
