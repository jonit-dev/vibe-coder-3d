import React, { useState } from 'react';

interface ISectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<ISectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#333]">
      <button
        className="w-full flex items-center gap-2 px-2 py-1 bg-[#23272e] hover:bg-[#292d33] text-xs font-bold text-gray-200 uppercase tracking-wider select-none"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        <span>{title}</span>
      </button>
      {open && <div className="px-3 py-2">{children}</div>}
    </div>
  );
};

export default Section;
