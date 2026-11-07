// The library marks are the Sendline patch (sendline.now design/BRAND.md) in the library's colour, with the library's
// glyph knocked out in a dark ink of the same hue, the way sendline.now pairs a section colour with its ink
// (web/app/utils/sectionMark.ts). The wordmarks reuse the construction of the SENDLINE letters: one stroke of 7,
// square caps, round joins, a 42-unit advance and a 6–48 cap height, with the two-part rule underneath.

export const patch = 'M60 6 L105 24 L114 72 L84 110 H36 L6 72 L15 24 Z';
export const rim = 'M60 15 L96 30 L103 69 L79 100 H41 L17 69 L24 30 Z';

export const sendline = {
  colour: '#df7859',
  knockout: '#ffffff',
  route: 'M34 83 C34 66 53 69 53 54 C53 39 72 44 86 31',
  smallRoute: 'M34 83 C34 64 55 68 55 52 C55 36 74 42 88 30',
  start: [34, 83, 7],
  arrow: 'M86 22 L101 28 L89 39 Z',
};

export const letters = {
  C: 'M30 6 H12 C4 6 2 14 2 27 C2 40 4 48 12 48 H30',
  D: 'M4 6 V48 H16 C28 48 32 40 32 27 C32 14 28 6 16 6 Z',
  E: 'M30 6 H4 V48 H30 M4 27 H25',
  G: 'M30 6 H12 C4 6 2 14 2 27 C2 40 4 48 12 48 H30 V28 H18',
  I: 'M4 6 H30 M17 6 V48 M4 48 H30',
  L: 'M4 6 V48 H30',
  M: 'M4 48 V6 L17 30 L30 6 V48',
  N: 'M4 48 V6 L30 48 V6',
  O: 'M12 6 H22 C30 6 32 14 32 27 C32 40 30 48 22 48 H12 C4 48 2 40 2 27 C2 14 4 6 12 6 Z',
  R: 'M4 48 V6 H18 C27 6 30 11 30 17 C30 23 27 28 18 28 H4 M18 28 L30 48',
  S: 'M30 6 H10 C3 6 3 26 10 26 H24 C31 26 31 48 24 48 H4',
  T: 'M4 6 H30 M17 6 V48',
  4: 'M23 48 V6 L4 34 H31',
};

export const marks = {
  mongo4s: {
    word: 'MONGO4S',
    colour: '#5bbf7a',
    ink: '#061a0b',
    glyph: [
      'M40 40 a20 9 0 1 0 40 0 a20 9 0 1 0 -40 0',
      'M40 40 V76 a20 9 0 0 0 40 0 V40',
      'M40 58 a20 9 0 0 0 40 0',
    ],
    small: ['M38 38 a22 10 0 1 0 44 0 a22 10 0 1 0 -44 0', 'M38 38 V78 a22 10 0 0 0 44 0 V38'],
    smallStroke: 13,
  },
  logging4s: {
    word: 'LOGGING4S',
    colour: '#e5b54a',
    ink: '#1f1500',
    glyph: ['M34 45 L48 59 L34 73', 'M58 45 H86', 'M58 59 H80', 'M58 73 H70'],
    small: ['M28 42 L46 60 L28 78', 'M60 46 H92', 'M60 74 H80'],
    smallStroke: 14,
  },
  metrics4s: {
    word: 'METRICS4S',
    colour: '#52b6ea',
    ink: '#021a29',
    glyph: ['M43 82 V66', 'M60 82 V50', 'M77 82 V34'],
    small: ['M38 86 V66', 'M60 86 V48', 'M82 86 V30'],
    smallStroke: 15,
  },
};

export const advance = 42;
export const markGap = 150;

export const wordWidth = (word) => (word.length - 1) * advance + 32;
export const lockupWidth = (word) => markGap + wordWidth(word) + 6;

// The patch can be drawn the other way round — the library's colour as the glyph on a patch of its ink — for a mark
// that has to sit on a plate of the library's own colour.
export const markBody = (mark, { inverted = false } = {}) => {
  const fill = inverted ? mark.ink : mark.colour;
  const line = inverted ? mark.colour : mark.ink;

  return `<path fill="${fill}" d="${patch}"/>
    <path fill="none" stroke="${line}" stroke-width="4" opacity="0.85" d="${rim}"/>
    <g fill="none" stroke="${line}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
${mark.glyph.map((d) => `      <path d="${d}"/>`).join('\n')}
    </g>`;
};

export const smallBody = (mark) => `<path fill="${mark.colour}" d="${patch}"/>
    <g fill="none" stroke="${mark.ink}" stroke-width="${mark.smallStroke}" stroke-linecap="round" stroke-linejoin="round">
${mark.small.map((d) => `      <path d="${d}"/>`).join('\n')}
    </g>`;

// The rule breaks where the name meets the shared 4S, as SENDLINE's breaks between SEND and LINE.
export const wordBody = (word, letterInk, ruleColour, x, y, { rule = true, id } = {}) => {
  const split = word.length - 2;
  const nameEnd = (split - 1) * advance + 32;
  const suffixStart = split * advance + 4;
  const gap = (nameEnd + suffixStart) / 2;
  const glyphs = [...word].map((letter, i) => `    <path transform="translate(${i * advance})" d="${letters[letter]}"/>`).join('\n');
  const rules = rule
    ? `\n    <path stroke="${ruleColour}" stroke-width="5" d="M4 66 H${gap - 3}"/>
    <path stroke="${ruleColour}" stroke-width="5" d="M${gap + 3} 66 H${(word.length - 1) * advance + 30}"/>`
    : '';

  return `<g ${id ? `id="${id}" ` : ''}aria-label="${word}" transform="translate(${x} ${y})"
     fill="none" stroke="${letterInk}" stroke-width="7" stroke-linecap="square" stroke-linejoin="round">
${glyphs}${rules}
  </g>`;
};

export const sendlineMark = () => `<path fill="${sendline.colour}" d="${patch}"/>
    <path fill="none" stroke="${sendline.knockout}" stroke-width="4" opacity="0.85" d="${rim}"/>
    <path fill="none" stroke="${sendline.knockout}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" d="${sendline.route}"/>
    <circle cx="${sendline.start[0]}" cy="${sendline.start[1]}" r="${sendline.start[2]}" fill="${sendline.knockout}"/>
    <path fill="${sendline.knockout}" d="${sendline.arrow}"/>`;

export const sendlineSmall = () => `<path fill="${sendline.colour}" d="${patch}"/>
  <path fill="none" stroke="${sendline.knockout}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" d="${sendline.smallRoute}"/>`;

export const inlineSvg = (body, { label, className = 'mark', viewBox = '0 0 120 120' } = {}) =>
  `<svg class="${className}" viewBox="${viewBox}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;
