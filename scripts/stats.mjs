import { writeFile } from "node:fs/promises";

const LOGIN = process.env.PROFILE_LOGIN || "FreezingSnail";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.STATS_TOKEN;

if (!TOKEN) {
  console.error("Missing GH_TOKEN, GITHUB_TOKEN, or STATS_TOKEN.");
  process.exit(1);
}

const query = `
  query($login: String!) {
    user(login: $login) {
      login
      followers { totalCount }
      repositories(first: 100, ownerAffiliations: [OWNER], privacy: PUBLIC, isFork: false) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount date } }
        }
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": `${LOGIN}-profile-stats`,
  },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
  signal: AbortSignal.timeout(20_000),
});

if (!response.ok) {
  throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
}

const payload = await response.json();
if (payload.errors?.length) {
  throw new Error(payload.errors.map((error) => error.message).join("; "));
}

const user = payload.data.user;
if (!user) throw new Error(`No GitHub user found for ${LOGIN}.`);

const repos = user.repositories.nodes;
const stars = repos.reduce((sum, repo) => sum + repo.stargazerCount, 0);

const languageBytes = new Map();
for (const repo of repos) {
  for (const edge of repo.languages.edges) {
    const name = edge.node.name;
    const current = languageBytes.get(name) || { name, color: edge.node.color, bytes: 0 };
    current.bytes += edge.size;
    languageBytes.set(name, current);
  }
}

const totalLanguageBytes = [...languageBytes.values()].reduce((sum, item) => sum + item.bytes, 0);
const topLanguages = [...languageBytes.values()]
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 5);

const weeks = user.contributionsCollection.contributionCalendar.weeks.slice(-26);
const days = weeks.flatMap((week) => week.contributionDays);
const maxDay = Math.max(1, ...days.map((day) => day.contributionCount));
const totalContributions = user.contributionsCollection.contributionCalendar.totalContributions;

const fmt = new Intl.NumberFormat("en-US");
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[char]);

const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const PANEL = "#0a100e";
const STROKE = "#1f3b32";
const MUTED = "#6e8f82";
const TEXT = "#e6f4ee";
const BODY = "#b8d8ca";
const GREEN = "#7ee787";
const TEAL = "#56d4b0";

const statBlocks = [
  ["CONTRIBUTIONS", fmt.format(totalContributions), "last 365 days"],
  ["COMMITS", fmt.format(user.contributionsCollection.totalCommitContributions), "last 365 days"],
  ["PUBLIC REPOS", fmt.format(user.repositories.totalCount), `${fmt.format(stars)} stars`],
  ["FOLLOWERS", fmt.format(user.followers.totalCount), `${fmt.format(user.contributionsCollection.totalPullRequestContributions)} pull requests`],
];

const statsMarkup = statBlocks
  .map(([label, value, sub], index) => {
    const x = 28 + index * 211;
    return `<text x="${x}" y="68" fill="${MUTED}" font-size="10" letter-spacing="1.4" font-family="${FONT}">${label}</text>
    <text x="${x}" y="102" fill="${TEXT}" font-size="30" font-weight="700" font-family="${FONT}">${esc(value)}</text>
    <text x="${x}" y="121" fill="#4f6a5f" font-size="10" font-family="${FONT}">${esc(sub)}</text>`;
  })
  .join("\n");

const separators = [227, 438, 649]
  .map((x) => `<path d="M${x} 58v76" stroke="${STROKE}"/>`)
  .join("");

const languageMarkup = topLanguages
  .map((language, index) => {
    const y = 198 + index * 27;
    const percent = totalLanguageBytes ? (language.bytes / totalLanguageBytes) * 100 : 0;
    const width = Math.max(2, Math.round((percent / 100) * 300));
    const color = language.color || TEAL;
    return `<circle cx="31" cy="${y - 4}" r="4" fill="${color}"/>
    <text x="44" y="${y}" fill="${BODY}" font-size="11" font-family="${FONT}">${esc(language.name)}</text>
    <rect x="140" y="${y - 9}" width="300" height="8" rx="2" fill="#16241f"/>
    <rect x="140" y="${y - 9}" width="${width}" height="8" rx="2" fill="${color}" opacity="0.9"/>
    <text x="456" y="${y}" text-anchor="end" fill="${MUTED}" font-size="10" font-family="${FONT}">${percent.toFixed(1)}%</text>`;
  })
  .join("\n");

const heatColors = ["#16241f", "#1f6f5c", "#2ea884", "#56d4b0", "#7ee787"];
const levelFor = (count) => {
  if (count === 0) return 0;
  const ratio = count / maxDay;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
};

const heatMarkup = weeks
  .map((week, weekIndex) =>
    week.contributionDays
      .map((day, dayIndex) => {
        const x = 520 + weekIndex * 11;
        const y = 190 + dayIndex * 11;
        return `<rect x="${x}" y="${y}" width="8" height="8" rx="1.5" fill="${heatColors[levelFor(day.contributionCount)]}"><title>${esc(day.date)}: ${day.contributionCount}</title></rect>`;
      })
      .join(""),
  )
  .join("");

const legend = heatColors
  .map((color, index) => `<rect x="${748 + index * 14}" y="282" width="9" height="9" rx="1.5" fill="${color}"/>`)
  .join("");

const updated = new Date().toISOString().slice(0, 16).replace("T", " ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="430" viewBox="0 0 900 430" role="img" aria-labelledby="title desc">
  <title id="title">GitHub stats for ${esc(user.login)}</title>
  <desc id="desc">Contributions, commits, public repositories, followers, top languages, and a 26 week contribution heatmap.</desc>
  <defs>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="${GREEN}" opacity="0.025"/>
    </pattern>
  </defs>

  <rect x="1" y="1" width="898" height="428" rx="14" fill="${PANEL}" stroke="${STROKE}"/>
  <path d="M1 39h898" stroke="${STROKE}"/>
  <rect x="1" y="40" width="898" height="389" fill="url(#scanlines)" opacity="0.8"/>

  <circle cx="26" cy="20" r="5" fill="#ff5f56"/>
  <circle cx="46" cy="20" r="5" fill="#ffbd2e"/>
  <circle cx="66" cy="20" r="5" fill="#27c93f"/>
  <text x="450" y="25" text-anchor="middle" fill="${MUTED}" font-size="12" font-family="${FONT}">stats.sh — ${esc(user.login)}</text>
  <text x="872" y="25" text-anchor="end" fill="${GREEN}" font-size="10" letter-spacing="1.5" font-family="${FONT}">● LIVE</text>

  ${statsMarkup}
  ${separators}

  <path d="M28 148h844" stroke="${STROKE}"/>
  <text x="28" y="174" fill="${MUTED}" font-size="10" letter-spacing="1.4" font-family="${FONT}">TOP LANGUAGES</text>
  <text x="132" y="174" fill="#4f6a5f" font-size="10" font-family="${FONT}">by bytes</text>

  <text x="520" y="174" fill="${MUTED}" font-size="10" letter-spacing="1.4" font-family="${FONT}">CONTRIBUTION SIGNAL / 26W</text>

  ${languageMarkup}
  ${heatMarkup}

  <text x="520" y="290" fill="#4f6a5f" font-size="10" font-family="${FONT}">less</text>
  ${legend}
  <text x="828" y="290" fill="#4f6a5f" font-size="10" font-family="${FONT}">more</text>

  <path d="M28 370h844" stroke="${STROKE}"/>
  <text x="28" y="396" fill="#4f6a5f" font-size="10" font-family="${FONT}">updated ${updated} UTC</text>
  <text x="720" y="396" fill="#4f6a5f" font-size="10" font-family="${FONT}">generated by stats.yml</text>

  <rect x="28" y="407" width="7" height="12" fill="${GREEN}" opacity="0.9"/>
  <text x="43" y="417" fill="#4f6a5f" font-size="10" font-family="${FONT}">no third-party cards. no server. just a scheduled action.</text>
</svg>
`;

await writeFile(new URL("../assets/stats.svg", import.meta.url), svg);
console.log(`wrote stats.svg for ${user.login}`);
