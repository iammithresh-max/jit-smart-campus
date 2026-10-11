/**
 * JIT SMART CAMPUS - Unified Icon System
 * Pixel-perfect, consistent 24x24 SVG icons with uniform 2px stroke and rounded caps.
 * Replaces mixed emojis and ensures a cohesive consumer-grade visual design.
 */

export const ICONS = {
  home: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>`,

  canteen: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>`,

  stationery: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="12" y1="6" x2="16" y2="6"/>
      <line x1="12" y1="10" x2="16" y2="10"/>
    </svg>`,

  print: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8" rx="1"/>
    </svg>`,

  orders: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6"/>
      <path d="M9 16h4"/>
    </svg>`,

  profile: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,

  search: (size = 18, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`,

  cart: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>`,

  clock: (size = 16, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,

  users: (size = 16, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,

  chevronRight: (size = 18, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>`,

  chevronLeft: (size = 18, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>`,

  arrowRight: (size = 16, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>`,

  check: (size = 16, stroke = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,

  checkCircle: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="16 9 10 15 8 13"/>
    </svg>`,

  trash: (size = 16, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>`,

  plus: (size = 14, stroke = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`,

  minus: (size = 14, stroke = 2.5) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`,

  upload: (size = 24, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`,

  filePdf: (size = 24, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="10" y1="13" x2="10" y2="17"/>
      <path d="M10 13h2.5a1.5 1.5 0 0 1 0 3H10"/>
    </svg>`,

  shield: (size = 14, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`,

  star: (size = 12, fill = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,

  zap: (size = 14, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>`,

  sliders: (size = 16, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/>
      <line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>`,

  radioChecked: (size = 18) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#0D9488" stroke-width="2"/>
      <circle cx="12" cy="12" r="4.5" fill="#0D9488"/>
    </svg>`,

  radioUnchecked: (size = 18) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#CBD5E1" stroke-width="2"/>
    </svg>`,

  // Payment Provider & Method Icons
  gpay: (size = 28) => `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FFFFFF"/>
      <path d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11c-.5 2.6-1.9 4.8-4.1 6.3v5.2h6.6c3.9-3.6 6.1-8.9 6.1-15.5z" fill="#4285F4"/>
      <path d="M24 44.5c5.5 0 10.2-1.8 13.6-5l-6.6-5.2c-1.8 1.2-4.2 2-7 2-5.4 0-10-3.6-11.6-8.6H5.6v5.4C9 39.8 16 44.5 24 44.5z" fill="#34A853"/>
      <path d="M12.4 27.7c-.4-1.2-.7-2.5-.7-3.7s.3-2.5.7-3.7v-5.4H5.6C4.2 17.6 3.4 20.7 3.4 24s.8 6.4 2.2 9.1l6.8-5.4z" fill="#FBBC05"/>
      <path d="M24 11.5c3 0 5.7 1 7.8 3l5.9-5.9C34.1 5.4 29.4 3.5 24 3.5c-8 0-15 4.7-18.4 11.4l6.8 5.4c1.6-5 6.2-8.8 11.6-8.8z" fill="#EA4335"/>
    </svg>`,

  phonepe: (size = 28) => `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#5F259F"/>
      <path d="M33.5 13H19.5c-1.4 0-2.5 1.1-2.5 2.5v19c0 .8.7 1.5 1.5 1.5h3.5c.8 0 1.5-.7 1.5-1.5v-7h8c4.4 0 8-3.6 8-8s-3.6-6.5-8-6.5zm0 8h-8v-3.5h8c1.9 0 3.5 1.6 3.5 3.5s-1.6 3.5-3.5 3.5z" fill="#FFFFFF"/>
    </svg>`,

  paytm: (size = 28) => `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#002970"/>
      <path d="M11 17h6c2.2 0 4 1.8 4 4v0c0 2.2-1.8 4-4 4h-3v5h-3V17zm3 5h3c.6 0 1-.4 1-1s-.4-1-1-1h-3v2z" fill="#00BAF2"/>
      <path d="M23 17h3v13h-3V17zm8 0h3v4.5l3.5-4.5h3.8l-4.5 5.5 4.8 7.5h-3.8l-3.3-5.5-.5.7v4.8H31V17z" fill="#FFFFFF"/>
    </svg>`,

  bhim: (size = 28) => `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#FFFFFF"/>
      <path d="M12 9l12 7-12 7V9z" fill="#2E7D32"/>
      <path d="M24 16l12 7-12 7V16z" fill="#F57C00"/>
      <path d="M12 23l12 7-12 7V23z" fill="#1565C0"/>
      <text x="24" y="43" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="8" fill="#1A237E" letter-spacing="1">BHIM UPI</text>
    </svg>`,

  upiGeneric: (size = 24) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>`,

  card: (size = 24) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <circle cx="7" cy="15" r="1"/>
      <circle cx="11" cy="15" r="1"/>
    </svg>`,

  bank: (size = 24) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"/>
      <path d="M3 10h18"/>
      <path d="M5 6l7-4 7 4"/>
      <path d="M4 10v11"/>
      <path d="M20 10v11"/>
      <path d="M8 14v4"/>
      <path d="M12 14v4"/>
      <path d="M16 14v4"/>
    </svg>`,

  wallet: (size = 24) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
    </svg>`,

  cash: (size = 24) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>`,

  logOut: (size = 18, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>`,

  logout: (size = 18, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>`,

  ticket: (size = 20, stroke = 2) => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
      <line x1="13" y1="5" x2="13" y2="19" stroke-dasharray="2 2"/>
    </svg>`
};
