<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Prism consumer intelligence platform. Here's a summary of every change made:

**Client initialization** — Created `instrumentation-client.ts` at the project root. This is the Next.js 15.3+ recommended approach: PostHog is initialized once, globally, via the instrumentation file rather than inside a React component. The reverse proxy (`/ingest`) is configured so events route through the app's own domain, making them less likely to be blocked by ad blockers.

**Reverse proxy** — Added three rewrites to `next.config.ts` (`/ingest/static/*`, `/ingest/array/*`, `/ingest/*`) so all PostHog requests and assets are proxied through the Next.js server.

**Provider cleanup** — Removed the `posthog.init()` call from `src/providers/PostHogProvider.tsx` (it was initializing PostHog with the old host and a deprecated `NEXT_PUBLIC_POSTHOG_KEY` variable). The `<PostHogProvider>` wrapper is kept so React hooks remain available. Added a `PostHogIdentify` component that calls `posthog.identify()` with the Clerk user's ID, name, and email whenever a user is authenticated, and `posthog.reset()` on sign-out.

**Server-side client** — Created `lib/posthog-server.ts` with a `getPostHogClient()` factory (using `posthog-node`) for use in API routes. Installed `posthog-node`.

**Environment variables** — Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local`.

**Client-side events** — Added `posthog.capture()` calls across three client files.

**Server-side events** — Added `posthog.capture()` in `src/app/api/analyse/route.ts` for save success/failure events.

---

## Events instrumented

| Event | Description | File |
|---|---|---|
| `analysis_started` | User clicks "Extract Insights"; includes input type, model, industry, save toggle | `src/app/page.tsx` |
| `analysis_completed` | Analysis succeeds; includes Prism score band, detected industry, save status | `src/app/page.tsx` |
| `analysis_failed` | Analysis returns an error; includes error message | `src/app/page.tsx` |
| `file_uploaded` | User drops or browses a file; includes file type, size (KB), and upload method | `src/app/page.tsx` |
| `example_used` | User clicks an industry chip to auto-fill example text | `src/app/page.tsx` |
| `model_selected` | User picks a different AI model from the preset buttons | `src/app/page.tsx` |
| `industry_selected` | User picks an industry from the dropdown | `src/app/page.tsx` |
| `report_copied` | User copies the markdown report to clipboard | `src/components/PrismResults.tsx` |
| `report_shared` | User copies the shareable report URL; includes whether a saved ID exists | `src/components/PrismResults.tsx` |
| `report_exported_pdf` | User opens the print/PDF view; includes whether an on-demand save was needed | `src/components/PrismResults.tsx` |
| `report_downloaded` | User downloads the raw JSON analysis | `src/components/PrismResults.tsx` |
| `report_viewed` | A saved report is successfully loaded on the report detail page | `src/app/report/[id]/page.tsx` |
| `analysis_saved` | Server-side: analysis persisted to Supabase; includes report ID, industry, text length, model | `src/app/api/analyse/route.ts` |
| `analysis_save_failed` | Server-side: Supabase persistence failed; includes error message | `src/app/api/analyse/route.ts` |

---

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/469174/dashboard/1709380)
- [Analysis Conversion Funnel (wizard)](https://us.posthog.com/project/469174/insights/7ALygDiJ) — funnel from `analysis_started` → `analysis_completed`
- [Daily Active Analysers (wizard)](https://us.posthog.com/project/469174/insights/9JLEuvTR) — unique users running analyses per day
- [Report Engagement Actions (wizard)](https://us.posthog.com/project/469174/insights/4lPYBgNP) — share, PDF export, and JSON download trends
- [Analysis Failure Rate (wizard)](https://us.posthog.com/project/469174/insights/r4ZXWaxq) — `analysis_failed / analysis_started × 100`
- [Analysis Save Rate (wizard)](https://us.posthog.com/project/469174/insights/yfJHEq7c) — `analysis_saved / analysis_started × 100`

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
