# Proofboard

Proofboard is a small shared workspace for decisions that need a visible rationale. A group frames a question, adds concrete options, collects evidence for and against, casts one editable vote per person, and records the final call.

## Why this scope

A decision board is useful only when another person can join and see the same state. DeepSpace supplies the parts that matter: authentication, SQLite-backed records with live sync, and server-enforced permissions. The `votes` collection uses `userBound` and `uniqueOn: ['boardId', 'userId']` so a client cannot impersonate another voter or create a second vote on the same board. Presence will show who is reviewing a decision.

The first version treats boards as a shared workspace for signed-in members. Private invitations, payment, AI summaries, and external APIs add setup or policy surface without improving the main decision flow for this exercise. Evidence URLs stay as ordinary links; the app will not fetch or assert the truth of a source.

## Current progress

- Official DeepSpace 0.34 starter scaffolded in place.
- Product theme, static landing page, board list and creation flow.
- Board room with option creation.
- Typed collections for boards, options, evidence, and one-vote-per-user ballots.

Next: add evidence and voting to the board room, live presence, decision closeout, multi-user tests, and deployment. The app is not deployed yet.

## Local development

Use Node 24 and npm 11.6 or newer. Install dependencies with `npm install`. Sign in with `npx deepspace auth login` using the account that should own the app, then run `npx deepspace app init` once to register its immutable app ID. Start locally with `npx deepspace dev start` and typecheck with `npm run type-check`.

Before the first deploy, connect the intended public GitHub repository as `origin`. DeepSpace chooses its Git source on first deploy; this project is intended to use GitHub source. Never commit `.dev.vars` or login credentials.

## Build notes

An AI coding agent scaffolded and implemented the first slice under the applicant's direction. The applicant will review the code, exercise the core flow with two users, and record their own corrections before submission. The final submission note should say exactly which checks were completed rather than treating these plans as completed verification.
