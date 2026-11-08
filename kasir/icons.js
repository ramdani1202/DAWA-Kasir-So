// Sistem ikon SVG line-style konsisten, dipakai menggantikan emoji di seluruh UI.
// Semua ikon pakai stroke 1.8-2, sudut membulat, viewBox 24x24 -> konsisten & tajam di semua device.

const ICONS = {
  'drink-jar': '<path d="M7 8h10l-1 11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 13h5"/>',
  'drink-honey': '<path d="M7 8h10l-1 11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 13h5"/><path d="M12 4.2v1.6"/>',
  'drink-lemon': '<circle cx="12" cy="12" r="7.5"/><path d="M12 6.5v11M6.5 12h11" opacity="0.55"/><path d="M9 9l6 6M15 9l-6 6" opacity="0.35"/>',
  'coffee-cup': '<path d="M5 9h11v6.5A3.5 3.5 0 0 1 12.5 19h-4A3.5 3.5 0 0 1 5 15.5V9Z"/><path d="M16 10.5h1.5a2 2 0 0 1 0 4H16"/><path d="M8 6.2c0-.8.9-1 .9-1.8M11.5 6.2c0-.8.9-1 .9-1.8" opacity="0.7"/>',
  'drink-glass': '<path d="M8 3h8l-1.2 16.2a2 2 0 0 1-2 1.8h-1.6a2 2 0 0 1-2-1.8L8 3Z"/><path d="M7.3 8h9.4" opacity="0.7"/>',
  'drink-tea': '<path d="M5 9h11v6.5A3.5 3.5 0 0 1 12.5 19h-4A3.5 3.5 0 0 1 5 15.5V9Z"/><path d="M16 10.5h1.5a2 2 0 0 1 0 4H16"/><path d="M9 6c0-1 1-1 1-2M13 6c0-1 1-1 1-2" opacity="0.6"/>',
  'drink-milk': '<path d="M9 3h6l1 4-1.4 1.8c-.4.5-.6 1.1-.6 1.7V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8.5c0-.6-.2-1.2-.6-1.7L8 7l1-4Z"/><path d="M8.6 12h6.8" opacity="0.6"/>',
  'cookie': '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="14" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.1" fill="currentColor" stroke="none"/><circle cx="10" cy="15" r="0.9" fill="currentColor" stroke="none"/>',
  'cupcake': '<path d="M6 11h12l-1.2 7.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 11Z"/><path d="M7 11a5 5 0 0 1 10 0" /><circle cx="12" cy="4.5" r="1.3"/>',

  // UI action / status icons
  'cart': '<circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none"/><path d="M3 4h2l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 8H6"/>',
  'user': '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5"/>',
  'ticket': '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a1.6 1.6 0 0 0 0 3.2V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.8a1.6 1.6 0 0 0 0-3.2V8Z"/><path d="M14 6.5v11" stroke-dasharray="2.2 2.2"/>',
  'clock': '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/>',
  'check-circle': '<circle cx="12" cy="12" r="8.2"/><path d="M8.3 12.3l2.4 2.4 5-5.2"/>',
  'trash': '<path d="M5 7h14"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M7 7l.7 12a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9L17 7"/><path d="M10 11v6M14 11v6" opacity="0.6"/>',
  'download': '<path d="M12 4v11.5"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M5 18.5h14"/>',
  'dine-in': '<path d="M6 3v7a2.5 2.5 0 0 0 5 0V3"/><path d="M8.5 10v11"/><path d="M17 3c-1.4 0-2.5 1.6-2.5 5.5S15.6 14 17 14v7"/>',
  'takeaway': '<path d="M5 9h14l-1.1 9.3a2 2 0 0 1-2 1.7H8.1a2 2 0 0 1-2-1.7L5 9Z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="M9.5 5.2 8 3M14.5 5.2 16 3" opacity="0.6"/>',
  'cash': '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v0M18 15v0" opacity="0.6"/>',
  'qris': '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><path d="M14 14h2.3v2.3M14 20h2v-2M19 14h1.5v2M20.5 18v2h-2"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'close': '<path d="M6 6l12 12M18 6 6 18"/>',
  'bag': '<path d="M6 9h12l-1.1 9.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L6 9Z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
  'receipt': '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" opacity="0.65"/>',
  'install': '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M12 8v6.5"/><path d="M9 12l3 3 3-3" opacity="0.85"/><path d="M10.5 18h3" opacity="0.5"/>',
};

// Render an inline SVG string for a given icon name.
function svgIcon(name, opts) {
  opts = opts || {};
  const size = opts.size || 22;
  const strokeWidth = opts.strokeWidth || 1.8;
  const cls = opts.cls ? ` class="${opts.cls}"` : '';
  const path = ICONS[name] || '';
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
