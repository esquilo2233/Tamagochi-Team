// SVG do samurai padrão (inline para não depender do sistema de arquivos no Vercel)
export const DEFAULT_SAMURAI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <defs>
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="2" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="500" fill="#ffffff"/>
  <g transform="translate(200, 250)">
    <ellipse cx="0" cy="-80" rx="45" ry="50" fill="#000000"/>
    <ellipse cx="0" cy="-130" rx="35" ry="25" fill="#000000"/>
    <path d="M -35 -130 Q 0 -150 35 -130" fill="#000000"/>
    <path d="M -30 -100 Q -40 -110 -35 -120" stroke="#000000" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M 30 -100 Q 40 -110 35 -120" stroke="#000000" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M -25 -90 Q -30 -100 -28 -110" stroke="#000000" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M 25 -90 Q 30 -100 28 -110" stroke="#000000" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M -20 -85 Q -25 -95 -22 -105" stroke="#000000" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M 20 -85 Q 25 -95 22 -105" stroke="#000000" stroke-width="5" fill="none" stroke-linecap="round"/>
    <line x1="-25" y1="-125" x2="-15" y2="-135" stroke="#ffffff" stroke-width="2"/>
    <line x1="25" y1="-125" x2="15" y2="-135" stroke="#ffffff" stroke-width="2"/>
    <ellipse cx="-15" cy="-85" rx="8" ry="10" fill="#ffffff"/>
    <ellipse cx="15" cy="-85" rx="8" ry="10" fill="#ffffff"/>
    <circle cx="-15" cy="-86" r="4" fill="#000000"/>
    <circle cx="15" cy="-86" r="4" fill="#000000"/>
    <path d="M -25 -95 Q -15 -98 -8 -95" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 8 -95 Q 15 -98 25 -95" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <line x1="0" y1="-80" x2="0" y2="-70" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <path d="M -8 -65 Q 0 -62 8 -65" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="-15" y="-30" width="30" height="25" fill="#000000" rx="5"/>
    <path d="M -80 -30 Q 0 20 80 -30 L 80 120 Q 0 170 -80 120 Z" fill="#000000"/>
    <line x1="0" y1="-30" x2="0" y2="120" stroke="#ffffff" stroke-width="4"/>
    <line x1="-60" y1="0" x2="-60" y2="100" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
    <line x1="60" y1="0" x2="60" y2="100" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
    <line x1="-40" y1="10" x2="-40" y2="110" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
    <line x1="40" y1="10" x2="40" y2="110" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
    <path d="M -30 -20 L 0 -5 L 30 -20" stroke="#ffffff" stroke-width="3" fill="none"/>
    <path d="M -25 -15 L 0 -2 L 25 -15" stroke="#ffffff" stroke-width="2" fill="none"/>
    <rect x="-70" y="50" width="140" height="30" fill="#000000" rx="3"/>
    <line x1="-60" y1="55" x2="-60" y2="75" stroke="#ffffff" stroke-width="2"/>
    <line x1="-40" y1="55" x2="-40" y2="75" stroke="#ffffff" stroke-width="2"/>
    <line x1="-20" y1="55" x2="-20" y2="75" stroke="#ffffff" stroke-width="2"/>
    <line x1="0" y1="55" x2="0" y2="75" stroke="#ffffff" stroke-width="2"/>
    <line x1="20" y1="55" x2="20" y2="75" stroke="#ffffff" stroke-width="2"/>
    <line x1="40" y1="55" x2="40" y2="75" stroke="#ffffff" stroke-width="2"/>
    <line x1="60" y1="55" x2="60" y2="75" stroke="#ffffff" stroke-width="2"/>
    <path d="M -90 -20 Q -80 -10 -70 -20 L -65 10 Q -75 20 -85 10 Z" fill="#000000"/>
    <line x1="-90" y1="-15" x2="-65" y2="-5" stroke="#ffffff" stroke-width="2"/>
    <line x1="-90" y1="-5" x2="-65" y2="5" stroke="#ffffff" stroke-width="2"/>
    <line x1="-90" y1="5" x2="-65" y2="15" stroke="#ffffff" stroke-width="2"/>
    <rect x="-85" y="-25" width="8" height="50" fill="#000000" rx="2"/>
    <rect x="77" y="-25" width="8" height="50" fill="#000000" rx="2"/>
    <line x1="-81" y1="-20" x2="-81" y2="20" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="81" y1="-20" x2="81" y2="20" stroke="#ffffff" stroke-width="1.5"/>
    <g transform="rotate(-15)">
      <rect x="-8" y="-140" width="12" height="200" rx="3" fill="#000000"/>
      <line x1="-2" y1="-140" x2="-2" y2="60" stroke="#ffffff" stroke-width="1.5"/>
      <line x1="2" y1="-140" x2="2" y2="60" stroke="#ffffff" stroke-width="1"/>
      <rect x="-12" y="-140" width="8" height="50" rx="2" fill="#000000"/>
      <line x1="-8" y1="-140" x2="-8" y2="-90" stroke="#ffffff" stroke-width="1"/>
      <line x1="-12" y1="-130" x2="-4" y2="-130" stroke="#ffffff" stroke-width="1"/>
      <line x1="-12" y1="-120" x2="-4" y2="-120" stroke="#ffffff" stroke-width="1"/>
      <line x1="-12" y1="-110" x2="-4" y2="-110" stroke="#ffffff" stroke-width="1"/>
      <line x1="-12" y1="-100" x2="-4" y2="-100" stroke="#ffffff" stroke-width="1"/>
      <circle cx="-8" cy="-90" r="8" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <circle cx="-8" cy="-90" r="5" fill="#000000"/>
    </g>
    <ellipse cx="-75" cy="20" rx="20" ry="60" fill="#000000"/>
    <ellipse cx="75" cy="20" rx="20" ry="60" fill="#000000"/>
    <line x1="-75" y1="-20" x2="-75" y2="60" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
    <line x1="75" y1="-20" x2="75" y2="60" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
    <ellipse cx="-75" cy="70" rx="12" ry="15" fill="#000000"/>
    <ellipse cx="75" cy="70" rx="12" ry="15" fill="#000000"/>
    <line x1="-75" y1="65" x2="-75" y2="80" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
    <line x1="75" y1="65" x2="75" y2="80" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
  </g>
</svg>`;
