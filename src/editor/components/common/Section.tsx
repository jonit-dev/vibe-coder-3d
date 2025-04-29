import React, { useState } from 'react';

export interface ISectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Section: React.FC<ISectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#333]">
      <button
        className="w-full flex items-center gap-2 px-2 py-1 bg-[#23272e] hover:bg-[#292d33] text-xs font-bold text-gray-200 uppercase tracking-wider select-none"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span
          className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {/* Chevron SVG icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 6L13 10L7 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>{title}</span>
      </button>
      {open && <div className="px-3 py-2">{children}</div>}
    </div>
  );
};
