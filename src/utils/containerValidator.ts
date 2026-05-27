/**
 * ISO 6346 Maritime Shipping Container Number Check-Digit Validator
 * Format: 4 Letters (A-Z) + 6 Digits (0-9) + 1 Check Digit (0-9)
 */
export function validateISO6346(container: string): { isValid: boolean; error?: string } {
  const clean = container.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean) {
    return { isValid: false, error: 'Nomor Kontainer wajib diisi.' };
  }
  
  if (clean.length !== 11) {
    return { isValid: false, error: 'Format salah. Harus tepat 11 karakter Alfanumerik (contoh: KKFU1234567).' };
  }
  
  if (!/^[A-Z]{4}\d{7}$/.test(clean)) {
    return { isValid: false, error: 'Format wajib: 4 Huruf Awalan + 7 Digit Angka (contoh: KKFU1234567).' };
  }

  // Calculate ISO 6346 Check Digit
  const getLetterValue = (char: string): number => {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      return code - 48; // Digits map directly 0-9
    }
    // Letters map A=10 -> Z=38, skipping increments of 11 (11, 22, 33)
    const rawVal = code - 65 + 10;
    if (rawVal < 10 || rawVal > 35) return 0;
    
    // Offset correction: skip 11, 22, 33
    let offset = 0;
    if (rawVal >= 11) offset++;   // skip 11
    if (rawVal >= 21) offset++;   // skip 22
    if (rawVal >= 31) offset++;   // skip 33
    
    return rawVal + offset;
  };

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const value = getLetterValue(clean[i]);
    // Weigh factor is 2^i
    sum += value * Math.pow(2, i);
  }

  // Modulo 11 check digit (if remainder is 10, check digit is 0)
  const calculatedCheckDigit = (sum % 11) % 10;
  const standardCheckDigit = parseInt(clean[10], 10);

  if (calculatedCheckDigit !== standardCheckDigit) {
    return {
      isValid: false,
      error: `Warning: Check-digit salah (Sistem menghitung: ${calculatedCheckDigit}, Anda menginput: ${standardCheckDigit}). Mohon cek ulang typo!`
    };
  }

  return { isValid: true };
}
