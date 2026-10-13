// Pulls the Laws table from Airtable and writes data/laws.json for the website.
// Runs nightly in GitHub Actions. Needs one secret: AIRTABLE_TOKEN (read-only personal access token).
// Field IDs are used instead of names, so renaming a column in Airtable won't break the site.
import { writeFile, readFile } from "node:fs/promises";

const BASE = "appEuACqyVXy4exxO";
const TABLE = "tblVNaGqZi8iSztU6";
const F = {
  name: "fldaL1qOuefxppNNy", abbr: "fldZPNvTftLJOaor4", status: "fldTEj1zKJRN7sGlr", category: "fld6vl2wAx0Ku4CiG",
  jurisdiction: "fldWBiZUg7AgE0xud", enforcementDate: "flddK4kDVPArF05E1", enforcer: "fldu5fQB3rITz0SOF",
  effective: "fldoAdUWog8qiNL6k", threshold: "fldKmkI3AHgixsCGd", summary: "fldNmd84PC9v9WwZx", build: "fldVtA6NFH3NsDTJC",
  state: "fldeS8UejlPyz6LwE", trigger: "fldvqmFVw7aNIous7", min: "fld7RReVJL7tfGZci", alt: "fldmgRgK24i63ArXZ",
  altPct: "fldAFTuzkHlZtR1WI", altInclusive: "fld4gIYTLdlr30qly", requiresRevenue: "fldLIOknpddvVinrN",
  revenueAlone: "fldAc71YMvJ5cKgB5", volumeOnlyIfSelling: "fldhmEv5jWw2ygocO", anySensitive: "fldm6WpQpREAiZxQC",
  anySale: "fldhBSmgSRSPaOCj8", unlessSmall: "fldTs5EULnddgrj6Q", dutyBelow: "fldi844nreYch1JPE",
  gpc: "fld6yU0cfBD028N0S", sensitiveRule: "fldAZul1U7cBz2njk", assessment: "fldgnTYpZSEt0kqUI",
  days: "fldg2fO2eJGNBh45C", cure: "fldXjXVQ21BeRYgtl", next: "fldiO9lgdpaG7jp0M", reviewed: "fldeHPF74vwVrxbiD",
};

const token = process.env.AIRTABLE_TOKEN;
if (!token) { console.error("Missing AIRTABLE_TOKEN secret."); process.exit(1); }

async function fetchAll() {
  const rows = []; let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${TABLE}`);
    url.searchParams.set("returnFieldsByFieldId", "true");
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const body = await res.json();
    rows.push(...body.records); offset = body.offset;
  } while (offset);
  return rows;
}

const sel = v => (v && typeof v === "object" ? v.name : v) ?? null;
const num = v => (typeof v === "number" ? v : null);
const str = v => (typeof v === "string" && v.trim() ? v.trim() : null);

function toLaw(r) {
  const f = r.fields, g = k => f[F[k]];
  return {
    id: r.id, name: str(g("name")), abbr: str(g("abbr")) || str(g("name")),
    status: sel(g("status")), category: sel(g("category")), jurisdiction: str(g("jurisdiction")),
    state: str(g("state"))?.toUpperCase() || null, trigger: sel(g("trigger")),
    effective: str(g("effective")), enforcementDate: str(g("enforcementDate")), enforcer: str(g("enforcer")),
    threshold: str(g("threshold")), summary: str(g("summary")), build: str(g("build")), next: str(g("next")),
    reviewed: str(g("reviewed")),
    checker: {
      min: num(g("min")), alt: num(g("alt")), altPct: num(g("altPct")), altInclusive: !!g("altInclusive"),
      requiresRevenue: !!g("requiresRevenue"), revenueAlone: !!g("revenueAlone"), volumeOnlyIfSelling: !!g("volumeOnlyIfSelling"),
      anySensitive: !!g("anySensitive"), anySale: !!g("anySale"), unlessSmall: !!g("unlessSmall"), dutyBelow: str(g("dutyBelow")),
    },
    req: { gpc: !!g("gpc"), sensitive: sel(g("sensitiveRule")), assessment: !!g("assessment"), days: num(g("days")), cure: str(g("cure")) },
  };
}

const laws = (await fetchAll()).map(toLaw)
  .filter(l => l.name && l.trigger && l.trigger !== "Hidden")
  .sort((a, b) => a.name.localeCompare(b.name));

// Safety net: never publish a near-empty tracker because of an API hiccup or a bad filter.
if (laws.length < 10) { console.error(`Only ${laws.length} laws came back; refusing to overwrite the site.`); process.exit(1); }

const out = { synced: new Date().toISOString(), source: "Airtable: Privacy Law Tracker", laws };
let prev = null; try { prev = JSON.parse(await readFile("data/laws.json", "utf8")); } catch {}
if (prev && JSON.stringify(prev.laws) === JSON.stringify(out.laws)) { console.log("No changes in Airtable."); process.exit(0); }
await writeFile("data/laws.json", JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${laws.length} laws.`);
