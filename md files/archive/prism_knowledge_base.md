# Markdown Files Organization Plan

The `md files` directory currently contains 28 files, mostly chronological session summaries, feature-specific reports, and a few architectural documents. To make this maintainable, we will consolidate them into 6 **Master Documents** that serve as the single source of truth for the project. 

## Proposed Master Files

### 1. `01-PRISM-Architecture-and-Vision.md`
**Purpose**: High-level platform vision, core architecture, and long-term roadmaps.
**Sources to merge**:
- `PRISM_V2_Architecture.md`
- `prism-platform-vision.md`
- `prism-saas-roadmap-v1.md`
- `prism_implementation_roadmap.md`

### 2. `02-PRISM-Backend-and-Security.md`
**Purpose**: Infrastructure, database schema, authentication, API integrations, and security protocols.
**Sources to merge**:
- `prism-authentication and backend summary june21.md`
- `prism-security-measures.md`
- `prism-security-summaryv1.md`
- `prism-together-api-migration-summary.md`

### 3. `03-PRISM-Features-and-Frontend.md`
**Purpose**: UI/UX design decisions, frontend implementation details, analytics setup, and specific feature overhauls.
**Sources to merge**:
- `prism-website-redesignv1.md`
- `prism_redesign_summary 17th may.md`
- `project summary quantitative overhaul june23.md`
- `posthog-setup-report.md`

### 4. `04-PRISM-AI-and-Prompts.md`
**Purpose**: Core AI logic, system prompts, and AI model configurations.
**Sources to merge**:
- `advanced_system_prompt.md`
- Any AI-specific notes from session logs.

### 5. `05-PRISM-Business-and-Strategy.md`
**Purpose**: Go-to-market strategy, pricing, and business metrics.
**Sources to merge**:
- `prism-pricing-strat.md`

### 6. `06-PRISM-Dev-Changelog.md`
**Purpose**: A single running log of daily/weekly updates, replacing the scattered dated files. Future session summaries will simply be appended as new sections here (e.g., `## 2026-06-27`).
**Sources to merge** (all dated files):
- `13-june-round2.md`, `14-june-round1.md`, `session-summary-16-june.md`
- `project-summary-16thjune.md`, `project-summary-22june.md`, `project_summary_26june.md`
- `projectsummary-june20.md`, `prism-session-summary-june13.md`
- `prism-summary-27th-may.md`, `prism_project_summary (12:5:26).md`
- `prism_session_summary (12th may v2).md`, `prism_session_summary (14th may).md`
- `prism_troubleshooting_summary_14_may.md`

*(Note: `prism-analysis-hotel reivews.json` will be left as-is or moved to a data/assets folder since it is raw JSON).*

> [!IMPORTANT]
> **User Review Required**
> Are you happy with these 6 categories? Once approved, I will systematically read the contents of the old files, merge their information into the new Master Files with clear headings, and then move the old files into an `archive` sub-folder (or delete them, based on your preference).

## Open Questions

> [!WARNING]
> 1. **Archiving vs Deleting:** After consolidating the content into the master files, should I move the original files into an `archive` folder, or completely delete them?
> 2. **File Location:** Should these new 6 master files live directly in the root of the `md files` directory or in the main project root?

## Proposed Execution Steps

1. **Create the 6 Master Files** with basic templates and headers.
2. **Merge Content**: I will go through the categories one by one. For each category, I will read the source files and synthesize/append their contents into the respective master file, ensuring duplicate information is cleaned up and formatting is consistent.
3. **Compile the Changelog**: For the dated files, I will extract their key updates and append them chronologically into `06-PRISM-Dev-Changelog.md`.
4. **Cleanup**: Create an `archive` folder inside `md files` and move all the old processed files there to immediately declutter the workspace.

## Verification Plan
- Verify all 27 markdown files have been processed and moved out of the main `md files` view.
- Ensure the 6 new Master Files are correctly formatted and contain all the crucial information.
