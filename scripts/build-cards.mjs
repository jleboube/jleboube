// Builds the stats + languages cards from live GitHub data.
// Needs GITHUB_TOKEN (the default Actions token is enough). Writes to ./profile-assets/.
// Run: GITHUB_TOKEN=... node scripts/build-cards.mjs [user]
import { mkdirSync, writeFileSync } from "node:fs";
import { palettes, fontFaceCss, SANS, MONO, esc } from "./theme.mjs";

const user = process.argv[2] || process.env.PROFILE_USER || "jleboube";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is not set");
const outDir = process.env.OUT_DIR || "profile-assets";

async function gql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-cards" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL error: ${res.status} ${JSON.stringify(json.errors || json)}`);
  return json.data;
}

// ---- data ----
const base = await gql(`query($u:String!){user(login:$u){createdAt
  repositories(ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,first:100){totalCount}}}`, { u: user });
const createdAt = new Date(base.user.createdAt);
const publicRepos = base.user.repositories.totalCount;

// Languages by bytes across public, non-fork repos (paged).
const langBytes = new Map();
let after = null;
do {
  const d = await gql(`query($u:String!,$a:String){user(login:$u){repositories(ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,first:100,after:$a){
    pageInfo{hasNextPage endCursor} nodes{languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}}}`, { u: user, a: after });
  const r = d.user.repositories;
  for (const n of r.nodes) for (const e of n.languages.edges) langBytes.set(e.node.name, (langBytes.get(e.node.name) || 0) + e.size);
  after = r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null;
} while (after);

// Contribution calendar, one year at a time, since the account was created.
const days = new Map();
const now = new Date();
for (let from = new Date(createdAt); from < now; ) {
  const to = new Date(Math.min(from.getTime() + 365 * 864e5, now.getTime()));
  const d = await gql(`query($u:String!,$f:DateTime!,$t:DateTime!){user(login:$u){contributionsCollection(from:$f,to:$t){
    contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`, { u: user, f: from.toISOString(), t: to.toISOString() });
  for (const w of d.user.contributionsCollection.contributionCalendar.weeks)
    for (const day of w.contributionDays) days.set(day.date, day.contributionCount);
  from = to;
}
const dates = [...days.keys()].sort();
const allTime = dates.reduce((s, k) => s + days.get(k), 0);
const yearAgo = new Date(now.getTime() - 365 * 864e5).toISOString().slice(0, 10);
const lastYear = dates.filter((k) => k > yearAgo).reduce((s, k) => s + days.get(k), 0);

let longest = 0, run = 0;
for (const k of dates) { run = days.get(k) > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
// Current streak: today may still be empty, so start from yesterday in that case.
let i = dates.length - 1;
if (i >= 0 && days.get(dates[i]) === 0) i--;
let current = 0;
for (; i >= 0 && days.get(dates[i]) > 0; i--) current++;

const fmt = (n) => n.toLocaleString("en-US");
const stats = { user, publicRepos, allTime, lastYear, longest, current, since: createdAt.getUTCFullYear(), updated: now.toISOString() };

// ---- cards ----
const W = 460, H = 210;
function card(c, title, body, h = H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(title)}">
<style>${fontFaceCss()}
.t{font-family:${SANS};font-weight:700;font-size:17px;fill:${c.text}}
.k{font-family:${MONO};font-size:11.5px;fill:${c.muted};letter-spacing:.6px}
.v{font-family:${SANS};font-weight:800;font-size:30px;fill:${c.text}}
.vs{font-family:${SANS};font-weight:700;font-size:22px;fill:${c.text}}
.a{fill:${c.ember}} .h{fill:${c.honey}}
.l{font-family:${SANS};font-weight:600;font-size:13px;fill:${c.text}}
.p{font-family:${MONO};font-size:12px;fill:${c.muted}}
.f{font-family:${MONO};font-size:10px;fill:${c.muted}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="16" fill="${c.panel}" stroke="${c.border}"/>
<rect x="24" y="26" width="10" height="10" rx="2" class="a"/><rect x="38" y="26" width="10" height="10" rx="2" class="h"/>
<text x="58" y="36" class="t">${esc(title)}</text>
${body}
</svg>
`;
}

function statsCard(c) {
  const cell = (x, y, label, value, cls = "v", delay = 0) =>
    `<g><text x="${x}" y="${y}" class="k">${esc(label)}</text><text x="${x}" y="${y + 32}" class="${cls}">${esc(value)}</text></g>`;
  const body = [
    cell(24, 72, "CONTRIBUTIONS · ALL TIME", fmt(allTime), "v", 0),
    cell(250, 72, "PAST 365 DAYS", fmt(lastYear), "v", 0.1),
    cell(24, 140, "CURRENT STREAK", `${current} day${current === 1 ? "" : "s"}`, "vs", 0.2),
    cell(170, 140, "LONGEST STREAK", `${longest} day${longest === 1 ? "" : "s"}`, "vs", 0.3),
    cell(330, 140, "PUBLIC REPOS", fmt(publicRepos), "vs", 0.4),
    `<rect x="24" y="${H - 22}" width="${W - 48}" height="1" fill="${c.border}"/>`,
    `<text x="24" y="${H - 8}" class="f">on GitHub since ${stats.since} · updated ${now.toLocaleDateString("en-CA", { timeZone: "America/Chicago" })} · from the GitHub API</text>`,
  ].join("\n");
  return card(c, "GitHub activity", body);
}

const EXCLUDE = new Set(["HTML", "CSS", "SCSS", "Jupyter Notebook", "Dockerfile", "Makefile", "Procfile"]);
const langs = [...langBytes].filter(([n]) => !EXCLUDE.has(n)).sort((a, b) => b[1] - a[1]);
const top = langs.slice(0, 6);
const totalBytes = langs.reduce((s, [, b]) => s + b, 0) || 1;

function langCard(c) {
  const cols = [c.ember, c.honey, c.rust, c.olive, c.muted, c.text];
  const barW = W - 48;
  let x = 24;
  const segs = top.map(([n, b], i) => {
    const w = Math.max(2, (b / totalBytes) * barW);
    const s = `<rect x="${x.toFixed(1)}" y="62" width="${w.toFixed(1)}" height="12" fill="${cols[i]}"/>`;
    x += w;
    return s;
  });
  const rest = `<rect x="24" y="62" width="${barW}" height="12" rx="6" fill="${c.border}"/>`;
  const legend = top.map(([n, b], i) => {
    const lx = 24 + (i % 2) * 210, ly = 104 + Math.floor(i / 2) * 26;
    return `<g><rect x="${lx}" y="${ly - 10}" width="11" height="11" rx="3" fill="${cols[i]}"/><text x="${lx + 19}" y="${ly}" class="l">${esc(n)}</text><text x="${lx + 186}" y="${ly}" class="p" text-anchor="end">${((b / totalBytes) * 100).toFixed(1)}%</text></g>`;
  });
  const body = `<clipPath id="bar"><rect x="24" y="62" width="${barW}" height="12" rx="6"/></clipPath>
${rest}<g clip-path="url(#bar)">${segs.join("")}</g>
${legend.join("\n")}
<rect x="24" y="${H - 22}" width="${W - 48}" height="1" fill="${c.border}"/>
<text x="24" y="${H - 8}" class="f">by bytes of code in ${publicRepos} public repos · markup excluded</text>`;
  return card(c, "Top languages", body);
}

mkdirSync(outDir, { recursive: true });
for (const [name, c] of Object.entries(palettes)) {
  writeFileSync(`${outDir}/stats-${name}.svg`, statsCard(c));
  writeFileSync(`${outDir}/languages-${name}.svg`, langCard(c));
}
writeFileSync(`${outDir}/stats.json`, JSON.stringify({ ...stats, topLanguages: top.map(([n, b]) => ({ name: n, share: +(b / totalBytes * 100).toFixed(2) })) }, null, 2));
console.log(JSON.stringify(stats));
