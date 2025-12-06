
import React from 'react';
import { EnhancementOptions, EnhancementType } from '../types';

interface EnhancementControlsProps {
  selectedOptions: EnhancementOptions;
  onToggle: (option: EnhancementType) => void;
  isProcessing: boolean;
}

const EnhancementControls: React.FC<EnhancementControlsProps> = ({ selectedOptions, onToggle, isProcessing }) => {
  const optionsList: { id: EnhancementType; label: string }[] = [
    { id: 'contrast', label: 'Contrast Enhancement' },
    { id: 'brightness', label: 'Brightness Adjustment' },
    { id: 'sharpening', label: 'Sharpening' },
    { id: 'color', label: 'Color Enhancement' },
    { id: 'noiseReduction', label: 'Noise Reduction' },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 justify-center py-4">
      {optionsList.map((option) => (
        <button
          key={option.id}
          onClick={() => onToggle(option.id)}
          disabled={isProcessing}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out
            ${selectedOptions[option.id]
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}
            ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            whitespace-nowrap
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default EnhancementControls;