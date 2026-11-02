import { writeFile } from "node:fs/promises";

const SNAIL = [
  "........................",
  "........................",
  "..............w..w......",
  "..............e..e......",
  "..............s..s......",
  ".....####.....s..s......",
  "...##++++##...s..s......",
  "..#++####++#..s..s......",
  ".#++#oooo#++#.ssssss....",
  ".#+#oo##oo#+#ssssssss...",
  ".#+#o####o#+#sssssssss..",
  ".#+#oo##oo#+#sssssssss..",
  ".#++#oooo#++#sssssssss..",
  "..#++####++#.sssssssss..",
  "...##++++##..ssssssss...",
  ".....####....ssssssss...",
  "...##########ssssssss...",
  "..###################...",
  "...#################....",
];

const COLORS = {
  "#": "#7ee787",
  "+": "#3fb950",
  o: "#1f6f5c",
  s: "#56d4b0",
  e: "#07100c",
  w: "#e6f4ee",
};

const CELL = 6;
const snailWidth = Math.max(...SNAIL.map((row) => row.length)) * CELL;
const snailHeight = SNAIL.length * CELL;

const pixels = SNAIL.flatMap((row, y) =>
  [...row].flatMap((cell, x) => {
    const fill = COLORS[cell];
    if (!fill) return [];
    return `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}" fill="${fill}"/>`;
  }),
).join("");

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
    const markup = `<g transform="translate(${pillX} 232)"><rect width="${width}" height="24" rx="4" fill="#101a17" stroke="#1f3b32"/><text x="${width / 2}" y="16" text-anchor="middle" fill="#9fb8ad" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">${label}</text></g>`;
    pillX += width + 10;
    return markup;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="320" viewBox="0 0 1000 320" role="img" aria-labelledby="title desc">
  <title id="title">FreezingSnail terminal card</title>
  <desc id="desc">A dark terminal window with a pixel snail and a short introduction.</desc>
  <defs>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#7ee787" opacity="0.025"/>
    </pattern>
    <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect x="1" y="1" width="998" height="318" rx="16" fill="#0a100e" stroke="#1f3b32"/>
  <path d="M1 39h998" stroke="#1f3b32"/>
  <rect x="1" y="40" width="998" height="279" fill="url(#scanlines)" opacity="0.8"/>

  <circle cx="26" cy="20" r="5" fill="#ff5f56"/>
  <circle cx="46" cy="20" r="5" fill="#ffbd2e"/>
  <circle cx="66" cy="20" r="5" fill="#27c93f"/>
  <text x="500" y="25" text-anchor="middle" fill="#6e8f82" font-size="12" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">freezing@snail — ~/profile</text>
  <text x="820" y="25" fill="#f2cc60" font-size="10" letter-spacing="1.5" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">● ONLINE</text>

  <g transform="translate(48 92)" filter="url(#soft-glow)">
    ${pixels}
  </g>

  <text x="250" y="82" fill="#6e8f82" font-size="12" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">freezing@snail:~$ <tspan fill="#7ee787">whoami</tspan></text>
  <text x="250" y="122" fill="#e6f4ee" font-size="30" font-weight="700" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">FreezingSnail</text>

  <text x="250" y="158" fill="#6e8f82" font-size="12" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">freezing@snail:~$ <tspan fill="#7ee787">cat about.txt</tspan></text>
  <text x="250" y="184" fill="#b8d8ca" font-size="14" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">small games. local-first tools.</text>
  <text x="250" y="206" fill="#b8d8ca" font-size="14" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">too many side quests.</text>

  ${pillMarkup}

  <rect x="250" y="274" width="7" height="14" fill="#7ee787" opacity="0.9"/>
  <text x="265" y="285" fill="#4f6a5f" font-size="10" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">status: building</text>
</svg>
`;

await writeFile(new URL("../assets/hero.svg", import.meta.url), svg);
console.log(`wrote hero.svg (${snailWidth}x${snailHeight} snail)`);
