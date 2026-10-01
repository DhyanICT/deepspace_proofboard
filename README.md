# Proofboard

Proofboard is a small shared workspace for decisions that need a visible rationale. A group frames a question, adds concrete options, collects reasons for and against, casts one editable vote per person, and records the outcome.

## Working flow

1. Sign in and create a board with a title, question, and optional context.
2. Share its link. Other signed-in members see the same options and evidence as they are added.
3. Add reasons for or against an option, with an optional HTTP(S) source link.
4. Vote once per board and change that vote as the reasons develop. The group sees live counts.
5. The board creator records an outcome in their own words. The board remains open for follow-up input, and that is stated in the UI.

## DeepSpace choices

- **Authentication:** the platform handles sign-in and sessions. The public landing is static; board data is visible only to signed-in members.
- **Records, live sync, and RBAC:** boards, options, evidence, and votes use DeepSpace collections in the app's RecordRoom. Confirmed writes surface server rejections before the UI claims success. The Durable Object enforces `userBound` voter identity and `uniqueOn: ['boardId', 'userId']` for one ballot per person per board.
- **Presence:** a separate ephemeral PresenceRoom for each board shows who is viewing that decision now.

The first version is a shared workspace for signed-in members, with no private invitations. This keeps the central collaboration flow testable in the exercise window. Structured reasons fit this product better than general chat, so we did not add messaging, AI summaries, payments, or an external API merely to raise the integration count. Evidence links are user-provided references; Proofboard does not verify their truth.

## Development and tests

Use Node 24 and npm 11.6 or newer. Install with `npm install`, authenticate with `npx deepspace auth login`, then run `npx deepspace dev start`. The app's immutable ID is registered in `wrangler.toml`; do not replace it. `.dev.vars` and local test credentials are ignored by Git.

- `npm run type-check`
- `npm run build`
- `npx deepspace test run` — smoke and API checks
- `npx deepspace test run tests/collab.spec.ts` — two-user flow, including live options, reasons, vote changes, presence, and outcome

Test accounts are managed by the DeepSpace CLI outside this repository. The collaboration test prefixes its created board with `__test-` so test data is recognizable in local development.

## Remaining before submission

Do a final visual and mobile pass, verify the deployed core path with two signed-in sessions, and put the live URL and repository into the portal. The applicant should personally review the code and exercise the app before writing the submission note. Report any remaining limitation honestly.

## Build ownership

An AI coding agent scaffolded and implemented the app under the applicant's direction. The final submission note should distinguish the agent's work from the applicant's own verification and any corrections they make; this README does not claim the applicant has already performed those checks.
