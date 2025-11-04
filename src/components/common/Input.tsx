import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  required = false,
  disabled = false,
  className = '',
  step,
  min,
  max,
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          className={`
            w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
          `}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
};