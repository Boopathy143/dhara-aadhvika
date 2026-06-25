// Helpers for rendering Indian Rupee amounts across the app and in PDFs.
//
// On the web, ₹ renders correctly via system Unicode fonts. In PDF generators
// that use jsPDF's built-in helvetica/times/courier fonts the ₹ glyph is NOT
// in the font and shows as "?" or a box. For PDFs we use the "Rs." prefix —
// the standard, professional fallback used across Indian invoicing software.
export function formatINR(value, { decimals = 0 } = {}) {
  const n = Number(value || 0);
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// HTML / on-screen: always use the ₹ glyph.
export function inr(value) {
  return `₹${formatINR(value)}`;
}

// PDF-safe currency string — uses "Rs." to avoid jsPDF unicode issues.
export function inrPdf(value) {
  return `Rs. ${formatINR(value)}`;
}

// Display "500 Gram" / "1 Kg" / "1 Litre" etc. for product packaging.
export const UNIT_OPTIONS = [
  'Kg', 'Gram', 'Litre', 'ml', 'Piece', 'Pack', 'Box', 'Bottle', 'Bag', 'Dozen', 'Bundle',
];

export function formatPack(p) {
  if (!p) return '';
  // New-style products use weight + unit fields.
  if (p.unit && (p.weight || p.weight === 0)) return `${p.weight} ${p.unit}`;
  // Legacy products had a single free-form `weight` string like "500g".
  if (p.weight) return String(p.weight);
  return '';
}
