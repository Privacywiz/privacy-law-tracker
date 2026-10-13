# Privacy Law Tracker

A screening tool for product teams without in-house counsel: answer a few questions, see which U.S. state, federal and EU privacy laws likely apply, and get a build list for each. Designed with the Gilded Brief design system.

**Airtable is the source of truth.** Edit laws there. Every night a GitHub Action pulls the Laws table into `data/laws.json` and republishes the site, so changes appear by the next morning. To publish sooner, open the **Actions** tab, pick **Sync from Airtable and publish**, and click **Run workflow**.

## One-time setup

1. **Create a read-only Airtable token.** In Airtable, go to Builder Hub → Personal access tokens → Create token. Give it the scope `data.records:read` and access to the *Privacy Law Tracker* base only. Copy the token.
2. **Add it to this repo.** Settings → Secrets and variables → Actions → New repository secret. Name: `AIRTABLE_TOKEN`. Paste the token.
3. **Turn on GitHub Pages.** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. **Run the first sync.** Actions → Sync from Airtable and publish → Run workflow. The site URL appears in the run summary.

## How the checker reads Airtable

Coverage logic comes from the `Checker:` fields on each law, so a threshold change in Airtable changes the checker too.

| Airtable field | What it does |
|---|---|
| State Code | Places the law on the map. Blank for federal and EU laws. |
| Checker: Trigger | `State thresholds` uses the fields below. Other values turn on when a visitor ticks the matching box. `Hidden` keeps a record off the site. |
| Checker: Min Consumers | Covered at or above this many state consumers. |
| Checker: Alt Consumers / Alt Revenue % / Alt % Inclusive | Second prong: this many consumers plus this share of revenue from selling data. `0` means any sales revenue. |
| Checker: Requires $25M Revenue | Revenue floor on top of the thresholds (Utah, Tennessee). |
| Checker: $25M Revenue Alone Qualifies | Revenue alone triggers coverage (California). |
| Checker: Volume Counts Only If Selling | Consumer threshold applies only to buying, selling or sharing (California). |
| Checker: Any Sensitive Data / Any Sale Qualifies | Coverage at any volume (Connecticut). |
| Checker: Applies Unless SBA Small Business | No volume threshold (Texas, Nebraska). |
| Checker: Duty Below Threshold | A duty that applies below the thresholds; marks the law "Confirm" (Rhode Island). |
| Honors GPC Signal, Sensitive Data Rule, Risk Assessment Required, Response Days, Cure Period | The "How the requirements differ" table. A cure period starting with "None" or "Ended" triggers the no-warning callout. |
| What Product Must Build | Lines starting with `- ` become checklist items; other lines show as notes. |
| Last Reviewed | The site's "Current as of" stamp shows the latest date here. Fill it in when you confirm a record. |

If fewer than 10 laws come back from Airtable, the sync stops instead of publishing a near-empty site.

## Not legal advice

The site screens for laws that may apply based on visitor answers and population-based estimates of users per state. Results should be confirmed with counsel.
