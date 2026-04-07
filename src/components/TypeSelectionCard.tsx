import { ReactNode } from 'react';

interface TypeSelectionCardProps {
  type: 'practice' | 'scholarship' | 'liveEvent';
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: (type: 'practice' | 'scholarship' | 'liveEvent') => void;
}

export default function TypeSelectionCard({
  type,
  title,
  description,
  icon,
  selected,
  onSelect
}: TypeSelectionCardProps) {
  return (
    <label
      className={`
        relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
        ${selected 
          ? 'border-indigo-600 bg-indigo-50 shadow-md' 
          : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-25'
        }
      `}
    >
      <input
        type="radio"
        name="competitionType"
        value={type}
        checked={selected}
        onChange={() => onSelect(type)}
        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
      />
      <div className="ml-3 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${selected ? 'text-indigo-600' : 'text-gray-600'}`}>
            {icon}
          </span>
          <span className={`font-semibold ${selected ? 'text-indigo-900' : 'text-gray-900'}`}>
            {title}
          </span>
        </div>
        <p className={`text-sm ${selected ? 'text-indigo-700' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
    </label>
  );
}
