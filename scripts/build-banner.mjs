// Builds assets/banner.svg: name, a typing line that cycles through phrases, and moving waves.
// Run: node scripts/build-banner.mjs
import { writeFileSync } from "node:fs";
import { palettes, fontFaceCss, SANS, MONO, MONO_ADVANCE, esc } from "./theme.mjs";

const phrases = [
  "Sr AI Operations Engineer",
  "CTO of MediKin Health",
  "20+ years in cloud & AI",
  "Shipping on Cloudflare Workers + D1",
  "Building with a team of Grok Bots",
  "Baseball apps for fun",
];

const W = 1200, H = 340;
const c = palettes.dark;
const fs = 30, charW = fs * MONO_ADVANCE;
const slot = 4; // seconds per phrase
const total = slot * phrases.length;
const tx = 72, ty = 222;

// Each phrase: visible for its slot, typed in over 1.4s, held, erased over 0.5s.
const pct = (s) => ((s / total) * 100).toFixed(3) + "%";
const phraseCss = phrases.map((p, i) => {
  const n = p.length;
  const start = i * slot;
  return `
#p${i}{opacity:0;animation:show${i} ${total}s linear infinite;}
@keyframes show${i}{0%,${pct(start)}{opacity:0}${pct(start + 0.001)},${pct(start + slot - 0.001)}{opacity:1}${pct(start + slot)},100%{opacity:0}}
#m${i}{transform-box:view-box;transform-origin:${tx}px 0;animation:type${i} ${total}s infinite;}
@keyframes type${i}{
 0%,${pct(start)}{transform:scaleX(0);animation-timing-function:steps(${n},end)}
 ${pct(start + 1.4)}{transform:scaleX(1)}
 ${pct(start + slot - 0.6)}{transform:scaleX(1);animation-timing-function:steps(${n},end)}
 ${pct(start + slot - 0.1)},100%{transform:scaleX(0)}}
#c${i}{opacity:0;animation:show${i} ${total}s linear infinite;}
#cm${i}{animation:caret${i} ${total}s infinite;}
@keyframes caret${i}{
 0%,${pct(start)}{transform:translateX(0);animation-timing-function:steps(${n},end)}
 ${pct(start + 1.4)}{transform:translateX(${n * charW}px)}
 ${pct(start + slot - 0.6)}{transform:translateX(${n * charW}px);animation-timing-function:steps(${n},end)}
 ${pct(start + slot - 0.1)},100%{transform:translateX(0)}}`;
}).join("");

const phraseSvg = phrases.map((p, i) => `
  <clipPath id="clip${i}"><rect id="m${i}" x="${tx}" y="${ty - fs}" width="${p.length * charW + 2}" height="${fs + 12}"/></clipPath>
  <text id="p${i}" x="${tx}" y="${ty}" clip-path="url(#clip${i})" class="type">${esc(p)}</text>
  <g id="c${i}"><rect id="cm${i}" class="caret" x="${tx + 2}" y="${ty - fs + 4}" width="3" height="${fs}"/></g>`).join("");

// Wave path, two periods wide so a translate of one period loops seamlessly.
const wave = (amp, len, y) => {
  let d = `M0 ${y}`;
  for (let x = 0; x < W * 2 + len; x += len) {
    d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`;
  }
  return d + ` V ${H} H 0 Z`;
};

// Pixel tiles: a quiet nod to the pixel/grid work.
const tiles = [];
const tileCols = [c.ember, c.honey, c.rust, c.olive];
let seed = 7;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) {
  if (rnd() < 0.42) continue;
  const x = 860 + k * 30, y = 44 + r * 30;
  const col = tileCols[Math.floor(rnd() * tileCols.length)];
  const d = (rnd() * 6).toFixed(2);
  tiles.push(`<rect class="tile" style="animation-delay:-${d}s" x="${x}" y="${y}" width="24" height="24" rx="4" fill="${col}"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Joe LeBoube</title>
<desc id="d">Sr AI Operations Engineer. CTO of MediKin Health. 20+ years in cloud and AI. Builds on Cloudflare Workers.</desc>
<style>
${fontFaceCss()}
.name{font-family:${SANS};font-weight:800;font-size:92px;fill:${c.text};letter-spacing:-2px}
.kicker{font-family:${MONO};font-weight:500;font-size:18px;fill:${c.honey};letter-spacing:1px}
.type{font-family:${MONO};font-weight:500;font-size:${fs}px;fill:${c.honey}}
.prompt{font-family:${MONO};font-weight:500;font-size:${fs}px;fill:${c.ember}}
.caret{fill:${c.ember};animation:blink 1s steps(1) infinite}
@keyframes blink{50%{fill-opacity:0}}
.w1{animation:drift 14s linear infinite}
.w2{animation:drift 9s linear infinite reverse}
@keyframes drift{to{transform:translateX(-300px)}}
.tile{animation:pulse 6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.9}50%{opacity:.25}}
${phraseCss}
@media (prefers-reduced-motion:reduce){*{animation:none!important}#p0,#c0{opacity:1}#m0{transform:none}}
</style>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="${c.bgDeep}"/></linearGradient>
  <radialGradient id="glow" cx="0.8" cy="0.25" r="0.5"><stop offset="0" stop-color="${c.ember}" stop-opacity=".35"/><stop offset="1" stop-color="${c.ember}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" rx="22" fill="url(#bg)"/>
<rect width="${W}" height="${H}" rx="22" fill="url(#glow)"/>
<g>${tiles.join("")}</g>
<text x="${tx}" y="78" class="kicker">~/jleboube · EVANSVILLE, IN</text>
<text x="${tx - 4}" y="168" class="name">Joe LeBoube</text>
${phraseSvg}
<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
<g opacity=".9" clip-path="url(#frame)">
  <path class="w1" d="${wave(10, 300, 300)}" fill="${c.rust}" fill-opacity=".55"/>
  <path class="w2" d="${wave(8, 300, 314)}" fill="${c.ember}" fill-opacity=".55"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${c.border}"/>
</svg>
`;
writeFileSync(new URL("../assets/banner.svg", import.meta.url), svg);
console.log("wrote assets/banner.svg", svg.length, "bytes");
