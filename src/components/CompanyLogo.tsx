/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface CompanyLogoProps {
  className?: string;
  size?: number | string;
}

export default function CompanyLogo({ className = 'h-11 w-11', size }: CompanyLogoProps) {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    // Read the custom saved logo from local storage
    const stored = localStorage.getItem('bsl_company_logo_v2');
    if (stored) {
      setLogo(stored);
    }

    // Capture dynamic logo updates instantly across all views
    const handleLogoChanged = () => {
      const updated = localStorage.getItem('bsl_company_logo_v2');
      setLogo(updated);
    };

    window.addEventListener('company-logo-updated', handleLogoChanged);
    return () => {
      window.removeEventListener('company-logo-updated', handleLogoChanged);
    };
  }, []);

  if (logo) {
    // If logo is a Base64 data string or a web URL link, render as crop-safe image
    if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://')) {
      return (
        <img
          id="custom-company-logo-img"
          src={logo}
          alt="Company Logo"
          referrerPolicy="no-referrer"
          className={`${className} object-contain rounded-lg shrink-0`}
          style={size ? { width: size, height: size } : undefined}
        />
      );
    }

    // Otherwise render as a clean stylized text monogram
    return (
      <div
        id="custom-company-logo-text"
        className={`${className} flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold shadow-sm border border-blue-500/20 shrink-0 select-none text-center uppercase tracking-tighter`}
        style={size ? { width: size, height: size, fontSize: '11px' } : { fontSize: '11px' }}
      >
        {logo.slice(0, 3)}
      </div>
    );
  }

  // Default beautiful maritime corporate blueprint logo if none is modified
  return (
    <svg
      id="company-logo-svg"
      className={`${className} shrink-0 select-none`}
      viewBox="0 0 120 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Left Upper crescent swish (Blue arc) */}
      <path
        d="M 65 24 C 40 24 23 41 23 66 C 23 68 23 70 23.3 71.8 C 22.3 69 22 66 22 63 C 22 38 41 20 65 20 C 70 20 74.8 21 79 23 C 74.5 22.5 69.8 24 65 24 Z"
        fill="#1e5cbd"
        className="fill-blue-600 dark:fill-sky-400"
      />

      {/* 2. Diagonally Split B - Left Blue Half */}
      <path
        d="M 38 29 L 55 29 C 55 29 60.5 33 55.4 39.5 L 49.3 46.5 C 47.5 45.4 45.5 44.5 42.5 44.5 L 38 44.5 L 38 48.5 L 43.5 48.5 L 34.5 58.5 L 38 58.5 L 47 48.5 L 47 48 L 51 43.5 L 56 38 C 59.5 34 58.5 29 52 26 L 35 26 L 38 29 Z"
        fill="#1e5cbd"
        className="fill-blue-600 dark:fill-sky-400"
      />

      {/* 3. Diagonally Split B - Right Gray Half */}
      <path
        d="M 58 30 L 53 35.5 C 57.5 35.5 61.5 38 61.5 43.5 C 61.5 48 58 52 52.5 52 L 44 52 L 39.5 57 L 53.5 57 M 53.5 57 C 62 57 67.5 51.5 67.5 45 C 67.5 39 63 33.5 58 30.5 L 58 30 Z"
        fill="#94a3b8"
        className="fill-slate-400 dark:fill-slate-500"
      />

      {/* 4. Waves at bottom (representing Samudera / Oceans) */}
      <path
        d="M 21 72 C 34 83 62 81 81 61 C 94 48 108 61 113 65 C 104 60 92 56 80 67 C 62 85 36 85 21 72 Z"
        fill="#1e5cbd"
        className="fill-blue-600 dark:fill-sky-400"
      />

      <path
        d="M 45 84 C 55 86 67 86 78 78 C 88 70 100 70 113 72 C 102 67 89 67 81 74 C 71 82 56 84 45 84 Z"
        fill="#94a3b8"
        className="fill-slate-400 dark:fill-slate-500"
      />
    </svg>
  );
}
