// Downloads the static shields.io badges once and checks them into assets/badges/,
// so the profile does not depend on shields.io or GitHub's image proxy at view time.
// Run: node scripts/build-badges.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const chip = (label, logo, color = "2a1912", logoColor = "e3a332") =>
  `https://img.shields.io/badge/${label}-${color}?style=for-the-badge&logo=${logo}&logoColor=${logoColor}`;
const status = (label, color) => `https://img.shields.io/badge/${label}-${color}?style=flat-square`;

const badges = {
  "site": chip("joeleboube.com", "googlechrome", "b34119", "f6ead8"),
  "linkedin": chip("LinkedIn", "linkedin"),
  "archbadger": chip("Arch_Badger_500", "atlassian"),
  "blog": chip("Blog", "rss"),
  "cloudflare-workers": chip("Cloudflare_Workers", "cloudflareworkers"),
  "d1": chip("D1", "cloudflare"),
  "durable-objects": chip("Durable_Objects", "cloudflare"),
  "typescript": chip("TypeScript", "typescript"),
  "javascript": chip("JavaScript", "javascript"),
  "python": chip("Python", "python"),
  "nextjs": chip("Next.js", "nextdotjs"),
  "react": chip("React", "react"),
  "nodejs": chip("Node.js", "nodedotjs"),
  "docker": chip("Docker", "docker"),
  "kubernetes": chip("Kubernetes", "kubernetes"),
  "linode": chip("Linode_(Akamai)", "akamai"),
  "stripe": chip("Stripe", "stripe"),
  "status-live": status("live", "4b5728"),
  "status-marketplace": status("atlassian_marketplace", "4b5728"),
  "status-review": status("in_marketplace_review", "8a3517"),
  "status-preview": status("early_preview", "c9802a"),
};

mkdirSync(new URL("../assets/badges/", import.meta.url), { recursive: true });
for (const [name, url] of Object.entries(badges)) {
  const res = await fetch(url);
  const type = res.headers.get("content-type") || "";
  const body = await res.text();
  if (!res.ok || !type.startsWith("image/svg+xml") || !body.includes("<svg")) throw new Error(`${name}: ${res.status} ${type}`);
  writeFileSync(new URL(`../assets/badges/${name}.svg`, import.meta.url), body);
  console.log("ok", name);
}
