import type { StoryTheme } from '../../content/stories';

const symbols: Record<StoryTheme, string> = {
  seed: '<path d="M12 22V11M12 16C3 16 3 6 4 4c7 0 9 6 8 12Zm0-4c-1-8 5-10 9-9 1 7-3 10-9 9Z"/>',
  letter: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7m-18 12 6-7m12 7-6-7"/>',
  lantern: '<path d="M8 7h8l2 3v10H6V10Zm0 0V4a4 4 0 0 1 8 0v3M5 20h14M9 10v7m6-7v7"/><path d="M12 12v4"/>',
  bottle: '<path d="M9 2h6v6l4 5v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6l4-5Zm0 3h6M9 15l5-2 2 5-5 2Z"/>',
  flower: '<path d="M12 22v-9m0 5c-5 0-7-3-7-3 5-1 7 3 7 3Zm0-6c-8 0-9-8-4-7-1-6 9-6 8 0 5-1 4 7-4 7Z"/><circle cx="12" cy="8" r="2"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
};

export const storySymbol = (theme: StoryTheme): string => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[theme]}</svg>`;

const drawings: Record<StoryTheme, string> = {
  seed: `
    <ellipse cx="214" cy="412" rx="112" ry="19" fill="var(--art-deep)" opacity=".15"/>
    <path d="M207 410c9-65-14-87-1-146 4-20 21-38 24-64 4 42-12 52-7 88 24-27 39-43 68-46-26 17-41 36-53 67-9 23-13 65-8 101Z" fill="var(--art-trunk)"/>
    <path d="M214 335c-30-14-40-39-62-51 32 3 37 19 60 25" fill="var(--art-trunk)"/>
    <g class="art-sway" style="transform-origin:220px 280px"><path d="M124 294c-43-9-37-55-4-65-7-36 27-62 55-53 12-41 72-44 93-16 40-12 73 14 69 44 34 20 31 62-3 74-31 21-53 5-77 16-27 13-60-1-79 2-21 5-36 8-54-2Z" fill="var(--art-leaf)"/>
    <path d="M135 252c17-29 29-33 52-34m18-24c21-16 43-12 58 1m12 43c19-14 37-7 41 5" fill="none" stroke="var(--art-paper)" stroke-width="2" opacity=".45"/>
    <g fill="var(--art-petal)" class="art-bloom"><circle cx="126" cy="265" r="6"/><circle cx="171" cy="222" r="5"/><circle cx="212" cy="184" r="7"/><circle cx="249" cy="214" r="5"/><circle cx="291" cy="253" r="7"/><circle cx="182" cy="277" r="6"/><circle cx="269" cy="277" r="4"/></g></g>
    <path d="M141 405q-2-30-17-40m17 27q18-23 29-18m-28 18q-24 1-29-16" fill="none" stroke="var(--art-leaf)" stroke-width="3"/>
    <path class="art-bloom" d="M280 408q-2-24 10-42m-9 30q18-8 24-2" fill="none" stroke="var(--art-leaf)" stroke-width="3"/>
  `,
  letter: `
    <g class="art-float" style="transform-origin:220px 305px">
    <path d="m106 247 105-83a15 15 0 0 1 18 0l105 83-19 139H125Z" fill="var(--art-petal)"/>
    <g class="art-letter"><rect x="134" y="197" width="174" height="166" rx="7" fill="var(--art-paper)" transform="rotate(-5 220 280)"/>
    <path d="m164 233 101-9m-98 29 80-7m-79 28 99-9m-97 29 62-5" stroke="var(--art-trunk)" stroke-width="2" opacity=".45"/>
    <path d="M244 322c-25-14-18-27-7-21 7-17 28-7 7 21Z" fill="var(--art-petal)"/></g>
    <path d="m106 247 114 84 114-84v139H106Z" fill="var(--art-envelope)"/>
    <path d="m106 386 95-80m133 80-95-80" fill="none" stroke="var(--art-paper)" opacity=".7" stroke-width="2"/>
    <circle cx="220" cy="333" r="19" fill="var(--art-petal)"/><path d="M220 344v-19m0 7c-11-1-10-12-10-12 10 1 12 8 10 12Zm0-5c1-9 9-12 13-9-1 10-7 13-13 9Z" fill="none" stroke="var(--art-paper)" stroke-width="1.3"/>
    </g>
    <path d="M102 425c10-27-4-48-23-71m17 36-24-9m26 25 20-18M324 432c-9-31 7-51 29-72m-24 37 27-12m-28 27-18-10" fill="none" stroke="var(--art-leaf)" stroke-width="2.5"/>
    <g fill="var(--art-leaf)"><ellipse cx="78" cy="353" rx="6" ry="12" transform="rotate(-34 78 353)"/><ellipse cx="69" cy="379" rx="12" ry="5" transform="rotate(25 69 379)"/><ellipse cx="354" cy="359" rx="6" ry="12" transform="rotate(34 354 359)"/><ellipse cx="359" cy="385" rx="12" ry="5" transform="rotate(-25 359 385)"/></g>
  `,
  lantern: `
    <circle class="art-glow" cx="220" cy="302" r="110" fill="url(#story-halo)"/>
    <g class="art-sway" style="transform-origin:220px 140px">
    <path d="M204 204v-28a16 16 0 0 1 32 0v28" fill="none" stroke="var(--art-gold)" stroke-width="3"/>
    <path d="m163 244 23-38h68l23 38-8 132h-98Z" fill="var(--art-deep)" stroke="var(--art-gold)" stroke-width="3"/>
    <path d="M178 252h84l-6 109h-72Z" fill="var(--art-paper)" opacity=".13"/>
    <path d="m163 244 57 16 57-16m-57 16v116m-36-124 4 109m68-109-4 109" fill="none" stroke="var(--art-gold)" stroke-width="2"/>
    <path class="art-flame" d="M211 345c-21-27 17-34 9-63 28 35 28 50 9 63Z" fill="var(--art-paper)"/><path d="M215 345v17h12v-17" fill="var(--art-gold)"/>
    <path d="M159 379h122m-108 8h94" stroke="var(--art-gold)" stroke-width="5" stroke-linecap="round"/>
    </g>
    <path d="M106 429q21-35-2-75m11 51 23-20m-22 3-22-10M318 435q-14-34 11-65m-13 39-20-12" stroke="var(--art-leaf)" stroke-width="2" fill="none"/>
    <g class="art-sparkles" fill="var(--art-paper)"><circle cx="118" cy="295" r="2.5"/><circle cx="314" cy="261" r="2"/><circle cx="298" cy="345" r="2.5"/><circle cx="151" cy="188" r="2"/></g>
  `,
  bottle: `
    <g fill="none" stroke="var(--art-paper)" stroke-width="1.5" opacity=".45"><ellipse cx="220" cy="406" rx="121" ry="17"/><ellipse cx="220" cy="410" rx="86" ry="9"/></g>
    <g class="art-float" style="transform-origin:220px 300px" transform="rotate(10 220 300)">
    <path d="M195 187h50v63c0 13 39 24 39 56v74c0 20-18 31-64 31s-64-11-64-31v-74c0-32 39-43 39-56Z" fill="var(--art-paper)" fill-opacity=".18" stroke="var(--art-paper)" stroke-width="2.5"/>
    <path d="M170 344q26-13 51 0t50 0v34q0 22-50 22t-51-22Z" fill="var(--art-leaf)" opacity=".45"/>
    <path d="M178 312v58m31-158v32" stroke="var(--art-paper)" stroke-width="4" stroke-linecap="round" opacity=".65"/>
    <rect x="199" y="165" width="43" height="34" rx="5" fill="var(--art-trunk)"/>
    <path d="m204 174 31 0m-31 12h31" stroke="var(--art-gold)" opacity=".6"/>
    <g transform="rotate(-13 224 331)"><rect x="203" y="284" width="42" height="89" rx="6" fill="var(--art-paper)"/><path d="M215 300h20m-20 11h18m-18 11h20m-20 11h15" stroke="var(--art-trunk)" opacity=".4"/><path d="m200 340 48 0" stroke="var(--art-petal)" stroke-width="4"/></g>
    <path d="M190 234q25 14 60 0m-34 8q-12 29-28 36" fill="none" stroke="var(--art-petal)" stroke-width="4"/>
    </g>
    <path d="M95 429q12-26-5-45m16 20 20-10M331 432q-10-28 9-51" fill="none" stroke="var(--art-leaf)" stroke-width="3"/>
  `,
  flower: `
    <ellipse cx="220" cy="426" rx="76" ry="11" fill="var(--art-deep)" opacity=".12"/>
    <g class="art-sway" style="transform-origin:220px 428px">
    <path d="M219 428c-5-61 14-95-1-157" fill="none" stroke="var(--art-leaf)" stroke-width="5"/>
    <path d="M219 380c-54-4-68-37-63-49 44-1 64 23 63 49m2-30c49-1 68-39 64-49-42-4-64 24-64 49" fill="var(--art-leaf)"/>
    <path d="m161 340 51 34m15-31 48-35" fill="none" stroke="var(--art-paper)" opacity=".55"/>
    <g class="art-bloom" style="transform-origin:220px 263px" fill="var(--art-petal)" stroke="var(--art-paper)" stroke-width="1.3">
    <path d="M220 263c-64-13-78-66-51-66 11-30 51 3 51 66Z"/><path d="M220 263c-50 40-101 18-84-6-17-30 37-37 84 6Z"/><path d="M220 263c-2-68 42-100 52-73 33 0 21 52-52 73Z"/><path d="M220 263c46-49 100-39 88-12 20 29-31 49-88 12Z"/><path d="M220 263c47 7 71 48 43 51-6 30-43 0-43-51Z"/><path d="M220 263c-42 19-51 63-24 61 17 26 42-12 24-61Z"/>
    <circle cx="220" cy="263" r="17" fill="var(--art-gold)" stroke="none"/><circle cx="220" cy="263" r="9" fill="none" stroke="var(--art-paper)" stroke-dasharray="1 4" stroke-width="3"/>
    </g></g>
    <path d="M130 429q2-23-9-36m8 26q14-16 24-11M301 429q-1-24 12-32" fill="none" stroke="var(--art-leaf)" stroke-width="2"/>
  `,
  star: `
    <path d="M122 423V265a98 98 0 0 1 196 0v158" fill="var(--art-deep)" fill-opacity=".42" stroke="var(--art-trunk)" stroke-width="15"/>
    <path d="M136 423V266a84 84 0 0 1 168 0v157" fill="none" stroke="var(--art-gold)" stroke-width="1.2" opacity=".6"/>
    <path d="M109 423h222m-214-21h19m168 0h20M118 310h17m170 0h17M157 191l9 12m108-12-9 12m-45-31v15" stroke="var(--art-paper)" opacity=".3" stroke-width="2"/>
    <circle class="art-glow" cx="220" cy="288" r="91" fill="url(#story-halo)"/>
    <g class="art-float" style="transform-origin:220px 288px"><path d="m220 239 14 32 36 5-26 25 6 36-30-17-31 17 6-36-25-25 35-5Z" fill="var(--art-gold)" stroke="var(--art-paper)" stroke-width="1.5"/><path d="m220 239 0 81m-50-44 74 25m-49 0 75-25" stroke="var(--art-paper)" opacity=".45"/></g>
    <path d="M220 426q-31-31 0-51 20-16 0-27" fill="none" stroke="var(--art-gold)" opacity=".5" stroke-dasharray="3 7"/>
    <path d="M91 429q18-36-4-72m14 43 21-19M335 433q-12-27 12-60" fill="none" stroke="var(--art-leaf)" stroke-width="2.5"/>
  `,
};

export function storyArt(theme: StoryTheme): string {
  const stars = Array.from({ length: 14 }, (_, i) => {
    const x = 46 + (i * 73) % 347, y = 85 + (i * 47) % 319;
    return `<circle class="art-dust" style="animation-delay:-${i * 0.7}s" cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2 : 1.1}" fill="var(--art-paper)" opacity=".65"/>`;
  }).join('');
  return `<svg class="story-svg" viewBox="0 0 440 520" fill="none" aria-hidden="true">
    <defs><radialGradient id="story-halo"><stop stop-color="var(--art-gold)" stop-opacity=".38"/><stop offset="1" stop-color="var(--art-gold)" stop-opacity="0"/></radialGradient><pattern id="story-grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="var(--art-paper)" opacity=".12"/></pattern></defs>
    <rect width="440" height="520" fill="var(--art-bg)"/><rect width="440" height="520" fill="url(#story-grain)"/>
    <circle cx="220" cy="240" r="165" stroke="var(--art-paper)" stroke-opacity=".13"/><circle cx="220" cy="240" r="145" stroke="var(--art-paper)" stroke-opacity=".09" stroke-dasharray="2 9"/>
    <path d="M0 429q94-57 193-6t247-19v116H0Z" fill="var(--art-deep)" opacity=".13"/>
    <path d="M0 469q125-41 231-9t209-3v63H0Z" fill="var(--art-deep)" opacity=".13"/>
    <path d="M40 58V38h20m320 0h20v20M40 462v20h20m320 0h20v-20" stroke="var(--art-paper)" stroke-opacity=".35"/>
    ${stars}${drawings[theme]}
  </svg>`;
}
