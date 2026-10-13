# Privacy Law Tracker

**Live site: [privacywiz.github.io/privacy-law-tracker](https://privacywiz.github.io/privacy-law-tracker/)**

A screening tool for product teams without in-house privacy counsel. Answer a few questions about your product and the tracker shows which U.S. state, federal and EU privacy laws likely apply to you, and what each one requires you to build.

It's informational, not legal advice. Use it to learn what questions to ask and what to plan for, then confirm with a lawyer before you launch.

## How to use it

1. **Describe your product** in the panel on the left: where your users are, roughly how many people's data you handle each year, your revenue, and what you do with data.
2. **Read the map.** States shaded dark blue with a check mark have a law that applies to you. Pink states with an alert mark are close to a threshold.
3. **Read the summary** under the map. It counts the laws that apply, the ones to confirm, and proposed laws worth watching.
4. **Compare requirements** in the table. Build to the strictest answer in each column and you'll meet every state on the list.
5. **Open each law** at the bottom for who it covers, why it applies to you, and a build list. Click "Copy as checklist" to paste the list into Jira, Linear or any ticketing tool.

## What the labels mean

| Label | What it means | What to do |
|---|---|---|
| **Applies** | Your answers meet this law's threshold. | Plan the build list into your roadmap. |
| **Confirm** | You're within about a third of a threshold, or a smaller duty applies even below it. | Count your actual users in that state and check with counsel. |
| **Proposed** | Not law yet, but it would affect you if passed. | Nothing required today. Consider designing ahead. |
| **Not triggered** | Your answers don't meet the threshold. | Revisit if your user base or data practices change. |

## Terms you'll see

- **Selling or sharing data.** Most state laws count more than cash sales. Sending personal data to ad networks through pixels or SDKs for targeted advertising usually counts as selling or sharing.
- **Sensitive data.** Health information, precise location, biometrics (face, voice, fingerprint), race, religion, sexual orientation, immigration status, government ID numbers, financial account log-ins, and data about children. Most states require opt-in consent before you collect it.
- **GPC (Global Privacy Control).** A browser setting that tells your site "don't sell or share my data." Many states require you to treat it as an opt-out automatically, with no extra clicks.
- **Risk assessment.** A written analysis you complete *before* launching higher-risk features such as targeted ads, data sales, profiling, or anything using sensitive data. Regulators can ask to see it.
- **Respond within.** How many days you have to answer a user's request to access, delete or correct their data.
- **Cure period.** Some states let you fix a problem within 30 to 60 days of a regulator's notice before penalties apply. Where it says "None" or "Ended," regulators can act on the first violation, so ship compliant from day one.
- **SBA small business.** Texas and Nebraska cover every business except those that qualify as small under U.S. Small Business Administration size standards, which vary by industry. If you aren't sure, assume you aren't one.

## How accurate is it?

- **User counts are estimates.** The tracker splits your total users across states by population. If your users cluster in certain states, check your real numbers for anything marked Confirm.
- **The data updates nightly** from a tracker maintained by a privacy attorney (CIPP/US). The date stamp at the top shows when the laws were last reviewed.
- **It covers 27 laws:** the comprehensive state privacy laws, Illinois's biometric law (BIPA), COPPA, HIPAA, GLBA, FERPA, the GDPR, and two federal proposals.
- **Not covered yet:** Washington's My Health My Data Act, Florida's Digital Bill of Rights, state children's online safety codes, and sector rules beyond those listed. If your product touches health data in Washington or is aimed at minors, talk to counsel directly.

## When to bring in a lawyer

- Anything marked **Confirm**
- Collecting **sensitive data**, especially health, biometric or precise location data
- A product **aimed at kids or teens**
- **Selling data** or building an ad-supported product
- Launching in the **EU**
- Using data to make **automated decisions** about people (credit, housing, hiring, insurance)

## Not legal advice

This tool screens for laws that may apply based on your answers and population-based estimates. It doesn't create an attorney-client relationship and isn't a substitute for advice about your specific product.
