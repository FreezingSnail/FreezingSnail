import { readFile, writeFile } from "node:fs/promises";

const logo = (await readFile(new URL("../assets/snailware.png", import.meta.url))).toString("base64");

const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const C = {
  bg0: "#0A6A7A",
  bg1: "#07516F",
  bg2: "#064957",
  panel: "#07516F",
  stroke: "#1C7491",
  text: "#F2FDFF",
  body: "#D6F8FF",
  muted: "#8FCBD6",
  dim: "#5FA8B8",
  green: "#66E6A0",
  cyan: "#6DE8F5",
  blue: "#B8EDFF",
  yellow: "#FFE36E",
};

const pills = [
  ["C++", 46],
  ["Rust", 54],
  ["Go", 42],
  ["Emacs Lisp", 96],
  ["Lua", 48],
];

let pillX = 250;
const pillMarkup = pills
  .map(([label, width]) => {
    const markup = `<g transform="translate(${pillX} 232)"><rect width="${width}" height="24" rx="5" fill="${C.panel}" fill-opacity="0.72" stroke="${C.stroke}"/><text x="${width / 2}" y="16" text-anchor="middle" fill="${C.blue}" font-size="11" font-family="${FONT}">${label}</text></g>`;
    pillX += width + 10;
    return markup;
  })
  .join("");

const bubbles = [
  [710, 86, 26, 0.08],
  [790, 210, 44, 0.06],
  [920, 118, 18, 0.1],
  [860, 300, 30, 0.05],
  [665, 270, 12, 0.12],
]
  .map(([cx, cy, r, opacity]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.blue}" opacity="${opacity}"/>`)
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="320" viewBox="0 0 1000 320" role="img" aria-labelledby="title desc">
  <title id="title">FreezingSnail terminal card</title>
  <desc id="desc">A glassy aqua terminal window with the Snailware logo and a short introduction.</desc>
  <defs>
    <linearGradient id="aero" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.bg0}"/>
      <stop offset="0.55" stop-color="${C.bg1}"/>
      <stop offset="1" stop-color="${C.bg2}"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.text}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${C.text}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="${C.cyan}" opacity="0.03"/>
    </pattern>
  </defs>

  <rect x="1" y="1" width="998" height="318" rx="18" fill="url(#aero)" stroke="${C.stroke}"/>
  <rect x="1" y="40" width="998" height="279" fill="url(#gloss)" opacity="0.55"/>
  <rect x="1" y="40" width="998" height="279" fill="url(#scanlines)" opacity="0.8"/>
  ${bubbles}

  <path d="M1 39h998" stroke="${C.stroke}"/>
  <circle cx="26" cy="20" r="5" fill="#FF6B7A"/>
  <circle cx="46" cy="20" r="5" fill="${C.yellow}"/>
  <circle cx="66" cy="20" r="5" fill="${C.green}"/>
  <text x="500" y="25" text-anchor="middle" fill="${C.muted}" font-size="12" font-family="${FONT}">freezing@snail — ~/profile</text>
  <text x="820" y="25" fill="${C.yellow}" font-size="10" letter-spacing="1.5" font-family="${FONT}">● ONLINE</text>

  <circle cx="120" cy="148" r="76" fill="${C.cyan}" opacity="0.10"/>
  <image x="56" y="84" width="128" height="128" href="data:image/png;base64,${logo}" image-rendering="pixelated"/>
  <text x="120" y="238" text-anchor="middle" fill="${C.muted}" font-size="10" letter-spacing="3" font-family="${FONT}">SNAILWARE</text>

  <text x="250" y="82" fill="${C.muted}" font-size="12" font-family="${FONT}">freezing@snail:~$ <tspan fill="${C.green}">whoami</tspan></text>
  <text x="250" y="122" fill="${C.text}" font-size="30" font-weight="700" font-family="${FONT}">FreezingSnail</text>

  <text x="250" y="158" fill="${C.muted}" font-size="12" font-family="${FONT}">freezing@snail:~$ <tspan fill="${C.green}">cat about.txt</tspan></text>
  <text x="250" y="184" fill="${C.body}" font-size="14" font-family="${FONT}">small games. local-first tools.</text>
  <text x="250" y="206" fill="${C.body}" font-size="14" font-family="${FONT}">too many side quests.</text>

  ${pillMarkup}

  <rect x="250" y="274" width="7" height="14" fill="${C.green}" opacity="0.95"/>
  <text x="265" y="285" fill="${C.dim}" font-size="10" font-family="${FONT}">status: building</text>
</svg>
`;

await writeFile(new URL("../assets/hero.svg", import.meta.url), svg);
console.log("wrote hero.svg with Snailware logo");
