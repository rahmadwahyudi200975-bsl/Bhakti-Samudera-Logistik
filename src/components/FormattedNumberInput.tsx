/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface FormattedNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  id?: string;
  placeholder?: string;
}

export default function FormattedNumberInput({
  value,
  onChange,
  className = '',
  id = '',
  placeholder = '0'
}: FormattedNumberInputProps) {
  const [showWarning, setShowWarning] = useState(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format the number with a thousands separator (commas)
  // If value is 0, display an empty string so the placeholder '0' shows up.
  // When the user starts typing, it overwrites the '0' naturally.
  const displayValue = value === 0 ? '' : new Intl.NumberFormat('en-US').format(value);

  const triggerWarning = () => {
    setShowWarning(true);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // List of allowed system control keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End'
    ];

    // Allow shortcuts (Ctrl / Cmd + A, C, V, X)
    const isModifierKey = e.ctrlKey || e.metaKey;
    const isShortcut = isModifierKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase());

    // Allow digits 0-9 (either from keyboard or numeric block)
    const isDigit = /^[0-9]$/.test(e.key);
    
    // Check if the key pressed is non-numeric and not one of the allowed utility keys/combinations
    if (!allowedKeys.includes(e.key) && !isShortcut && !isDigit) {
      // If it's a character key and not a digit, prevent it
      if (e.key.length === 1) {
        e.preventDefault();
        triggerWarning();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove all non-digit characters from the input text (e.g., in case of copy-paste)
    const cleanValue = rawValue.replace(/\D/g, '');
    
    if (rawValue !== cleanValue && rawValue) {
      triggerWarning();
    }

    // Convert to a number or default to 0 if empty
    const numericValue = cleanValue ? parseInt(cleanValue, 10) : 0;
    
    onChange(numericValue);
  };

  return (
    <div className="relative w-full">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={`${className} transition-all duration-200 ${
          showWarning 
            ? '!border-amber-500 ring-2 ring-amber-500/30 dark:!border-amber-400 dark:ring-amber-400/20' 
            : ''
        }`}
        value={displayValue}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {showWarning && (
        <span className="absolute right-2 -bottom-5 text-[10px] text-amber-600 dark:text-amber-400 font-bold tracking-tight bg-white dark:bg-slate-900 border border-amber-250 dark:border-amber-900/60 shadow-md px-1.5 py-0.5 rounded-md z-30 animate-pulse flex items-center gap-1 select-none pointer-events-none">
          ⚠️ Hanya menerima angka!
        </span>
      )}
    </div>
  );
}
