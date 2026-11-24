// src/utils/barcodeGenerator.js

/**
 * Standard Code 39 Barcode Pattern Table
 * Each character has 9 elements (5 bars, 4 spaces), exactly 3 are wide ('1') and 6 are narrow ('0').
 * Odd indices (0, 2, 4, 6, 8) are bars; even indices (1, 3, 5, 7) are spaces.
 */
const CODE39_PATTERNS = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

/**
 * Generates pure vector SVG Code 39 barcode string
 */
export function generateCode39Svg(text, options = {}) {
  const {
    height = 45,
    narrowWidth = 1.4,
    wideWidth = 3.2,
    gapWidth = 1.4,
    color = '#000000',
  } = options;

  if (!text) return '';

  // Clean string to allowed Code39 characters (uppercase alphanumeric + symbols)
  const clean = text
    .toString()
    .toUpperCase()
    .replace(/[^0-9A-Z\-.$/+% ]/g, '') || '000000';

  // Frame with start/stop character '*'
  const full = `*${clean}*`;

  const rects = [];
  let currentX = 6; // Left margin

  for (let i = 0; i < full.length; i++) {
    const char = full[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

    for (let p = 0; p < 9; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === '1';
      const width = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        rects.push(`<rect x="${currentX.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${height}" fill="${color}" />`);
      }
      currentX += width;
    }
    // Inter-character gap
    currentX += gapWidth;
  }

  const totalWidth = currentX + 6; // Right margin

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${height}" width="100%" height="${height}" preserveAspectRatio="none">
    ${rects.join('')}
  </svg>`;
}

/**
 * Helper to generate QR code URL (safe Google Charts / QRServer fallback)
 */
export function getQrCodeUrl(data, size = 150) {
  if (!data) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&data=${encodeURIComponent(data)}`;
}
