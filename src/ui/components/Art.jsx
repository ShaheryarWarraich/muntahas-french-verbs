import React from 'react';

// Wobbly pencil-line filter, defined once and used by CSS (filter: url(#pencil)) and the mascot.
export function PencilDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" />
        </filter>
        <filter id="pencil-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2" />
        </filter>
      </defs>
    </svg>
  );
}

function fluff(cx, cy, rx, ry, n) {
  const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  const r = (Math.PI * 2 * Math.max(rx, ry)) / n / 1.7;
  return pts.map((p, i) => { const q = pts[(i + 1) % n]; return `${i ? '' : `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join('') + 'Z';
}
const BODY = fluff(60, 70, 36, 32, 13);
const EAR_L = fluff(36, 30, 11, 12, 8);
const EAR_R = fluff(84, 30, 11, 12, 8);

// A small pencil-drawn fluffy creature. mood: happy | think | cheer | sleepy
export function Mascot({ mood = 'happy', size = 120, className = '' }) {
  const ink = 'var(--ink)';
  const mouth = { happy: 'M52 82 Q60 90 68 82', cheer: 'M50 80 Q60 96 70 80 Z', think: 'M55 85 Q60 83 65 85', sleepy: 'M54 84 Q60 87 66 84' }[mood] || 'M52 82 Q60 90 68 82';
  return (
    <svg className={`mascot ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="fluffy friend">
      <g filter="url(#pencil-soft)" strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx="60" cy="108" rx="30" ry="5" fill={ink} opacity=".1" />
        <path d={EAR_L} fill="#e5d8fa" stroke={ink} strokeWidth="2.4" />
        <path d={EAR_R} fill="#e5d8fa" stroke={ink} strokeWidth="2.4" />
        <path d={BODY} fill="#e5d8fa" stroke={ink} strokeWidth="2.6" />
        <path d="M33 62 l6 -3 M31 72 l7 -2 M86 60 l6 3 M88 72 l-7 -2 M45 100 l4 -5 M72 100 l-4 -5" stroke={ink} strokeWidth="1.3" opacity=".35" fill="none" />
        {mood === 'sleepy'
          ? <><path d="M44 70 q5 4 10 0 M66 70 q5 4 10 0" stroke={ink} strokeWidth="2.4" fill="none" /></>
          : <><circle cx="48" cy="68" r="4.4" fill={ink} /><circle cx="72" cy="68" r="4.4" fill={ink} /><circle cx="49.6" cy="66.4" r="1.4" fill="#fff" /><circle cx="73.6" cy="66.4" r="1.4" fill="#fff" /></>}
        {mood === 'think' && <path d="M42 57 q6 -5 12 -1" stroke={ink} strokeWidth="2" fill="none" />}
        <ellipse cx="41" cy="79" rx="5" ry="3.2" fill="#f4a6c4" opacity=".65" />
        <ellipse cx="79" cy="79" rx="5" ry="3.2" fill="#f4a6c4" opacity=".65" />
        <path d={mouth} stroke={ink} strokeWidth="2.4" fill={mood === 'cheer' ? '#fff' : 'none'} />
        {mood === 'cheer' && <><path d="M22 58 q-8 -12 -2 -22" stroke={ink} strokeWidth="2.4" fill="none" /><path d="M98 58 q8 -12 2 -22" stroke={ink} strokeWidth="2.4" fill="none" /></>}
        <path d="M44 100 q-2 6 4 6 M76 100 q2 6 -4 6" stroke={ink} strokeWidth="2.4" fill="none" />
        <g transform="rotate(35 98 92)"><rect x="94" y="72" width="8" height="26" rx="1.5" fill="#129486" stroke={ink} strokeWidth="2" /><path d="M94 98 L98 107 L102 98Z" fill="#f6d9a8" stroke={ink} strokeWidth="2" /></g>
      </g>
    </svg>
  );
}

export const Back = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M21 13 H6 M12 6 L5 13 L12 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const SpeakerIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
    <path d="M4 10 H8 L14 5 V21 L8 16 H4Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M17.5 9 Q20.5 13 17.5 17 M20.5 6.5 Q25 13 20.5 19.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
export const BackspaceIcon = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" aria-hidden="true"><path d="M9 2 H25 V20 H9 L2 11Z M13 7 L20 15 M20 7 L13 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const SkipIcon = () => (
  <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden="true"><path d="M3 4 L13 11 L3 18Z M14 4 L24 11 L14 18Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
);
export const Squiggle = ({ color = 'currentColor', width = 180 }) => (
  <svg width={width} height="14" viewBox="0 0 180 14" aria-hidden="true" preserveAspectRatio="none"><path d="M2 8 Q12 1 22 8 T42 8 T62 8 T82 8 T102 8 T122 8 T142 8 T162 8 T178 7" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" /></svg>
);
