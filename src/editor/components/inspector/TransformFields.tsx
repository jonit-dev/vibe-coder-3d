import React from 'react';

interface ITransformFieldsProps {
  label: string;
  value: [number, number, number];
  onChange: (next: [number, number, number]) => void;
}

const input =
  'bg-[#181a1b] border border-[#333] rounded px-2 py-1 text-xs text-white w-16 focus:outline-none focus:ring-2 focus:ring-blue-600';

const TransformFields: React.FC<ITransformFieldsProps> = ({ label, value, onChange }) => {
  const handleInput = (idx: number, val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return;
    const next: [number, number, number] = [...value] as [number, number, number];
    next[idx] = parsed;
    onChange(next);
  };
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs text-gray-300 w-20">{label}</span>
      <div className="flex gap-1 items-center">
        <span className="w-2 text-xs text-[#ff5555]">X</span>
        <input
          className={input}
          type="number"
          step={label === 'Scale' ? 0.1 : 0.01}
          value={value[0]}
          onChange={(e) => handleInput(0, e.target.value)}
        />
      </div>
      <div className="flex gap-1 items-center">
        <span className="w-2 text-xs text-[#55ff55]">Y</span>
        <input
          className={input}
          type="number"
          step={label === 'Scale' ? 0.1 : 0.01}
          value={value[1]}
          onChange={(e) => handleInput(1, e.target.value)}
        />
      </div>
      <div className="flex gap-1 items-center">
        <span className="w-2 text-xs text-[#5555ff]">Z</span>
        <input
          className={input}
          type="number"
          step={label === 'Scale' ? 0.1 : 0.01}
          value={value[2]}
          onChange={(e) => handleInput(2, e.target.value)}
        />
      </div>
    </div>
  );
};

export default TransformFields;
