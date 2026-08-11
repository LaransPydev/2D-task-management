# Sportstech · Creative Ops

Amazon creative asset pipeline tracker for the Sportstech creative team — a
12-stage board (Product → Concept → Design → Lead Review → Head Review →
Live Request → Ticket → Amazon Review → Live, with revision/rejection loops)
plus a performance dashboard and a ranked "needs attention" worklist.

This is a Next.js (App Router) rewrite of an earlier single-file HTML
prototype (kept for reference at [`legacy-static/index 1.html`](legacy-static/index%201.html)).
Everything now lives in a real Postgres database via Prisma, and every
mutation is permission-checked server-side, not just hidden behind a
disabled button.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Prisma 7** + **Postgres** (`@prisma/adapter-pg`)
- **SWR** for client-side polling (every 6s, so teammates see each other's
  changes without a hard refresh)
- Plain CSS (`app/globals.css`) — the original file's two-colour design
  system, ported essentially unchanged

## Local setup

```bash
npm install
```

You need a Postgres database. Easiest for local dev — Prisma can run one
for you, no Docker required:

```bash
npx prisma dev
```

This prints a connection string. Copy `.env.example` to `.env` and paste it
in as `DATABASE_URL`, then generate an `AUTH_SECRET`:

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste the output into .env as AUTH_SECRET
```

Create the tables and load the sample projects:

```bash
npx prisma migrate dev
npx prisma db seed
```

Then run the app:

```bash
npm run dev
```

Sign in by picking a name from the roster — no passwords. The full list of
who's on the team, and what each role can do, lives in
[`lib/domain.ts`](lib/domain.ts) (`ROSTER` / `ROLES`). Add, remove, or
re-role a teammate by editing that array and redeploying — same principle
as the original file: nobody can grant themselves a role that isn't a row
in that list.

## Deploying (Vercel + Vercel Postgres)

1. **Push this repo to GitHub** (or GitLab/Bitbucket) and import it in
   [vercel.com/new](https://vercel.com/new).
2. **Add a Postgres database**: in the project → **Storage** tab → **Create
   Database** → Postgres. Vercel wires `DATABASE_URL` (and a few related
   vars) into your project automatically.
3. **Add `AUTH_SECRET`**: Project Settings → Environment Variables → add
   `AUTH_SECRET` with a random 64-char hex value (same command as above).
   Use the **same value** in every environment you care about staying
   signed in across (Production/Preview) — changing it invalidates all
   existing sign-in cookies.
4. **Run the migration against the production database** (one-time, and
   again after any future schema change):
   ```bash
   npx vercel env pull .env.production.local   # pulls the real DATABASE_URL
   DATABASE_URL="$(grep DATABASE_URL .env.production.local | cut -d= -f2- | tr -d '"')" npm run db:migrate
   ```
   Or simpler: run `npx prisma migrate deploy` from any machine with the
   production `DATABASE_URL` in its environment.
5. **Seed it** (optional, first deploy only, if you want the sample
   projects rather than starting empty):
   ```bash
   DATABASE_URL="<production URL>" npm run db:seed
   ```
   Skip this for a real launch and just use **+ New project** in the UI —
   the seed data is sample data for trying the app out.
6. **Deploy** — Vercel builds on every push to your default branch.

After that, the whole team hits the same Vercel URL and shares one
database. No further setup screen exists in the app (unlike the original
file's "Setup" modal) because there's no client-editable config left —
the database is real infrastructure now, not a pasted API key.

## Project structure

```
app/
  actions/        Server Actions — auth (sign in/out) and board mutations
                   (create, move stage, block, edit, comment, delete).
                   Every one re-derives the session user and re-checks
                   permissions server-side; never trust the client.
  api/board/       Polled by the client (SWR) for near-live multi-user sync.
  generated/       Prisma Client output (gitignored, regenerated on install)
components/       React UI — mirrors the original file's views 1:1
  card/            The project card and its log/chat/details drawer panes
  modals/          New project / move / block / edit / who / delete / wipe
  views/           Pipeline, Board (kanban), Performance, Needs attention
lib/
  domain.ts        Stages, roles, roster, move graph, permission checks —
                    the actual business rules, framework-agnostic
  analytics.ts     Stage durations, monthly metrics, designer scorecards
  session.ts       Signed sign-in cookie (see below)
  prisma.ts data.ts  DB client + Prisma-row → plain-object mapping
prisma/
  schema.prisma    Project / Event / Comment tables
  seed.ts          Ports the original file's sample data
```

## Auth model

Sign-in is the same "pick your name, your role comes with it, no password"
flow as the original file — that was a deliberate choice for a small
internal team, not a placeholder. What's different from a plain static
file: the cookie only ever stores a *name*; the *role* is always
re-derived server-side from the roster, and the cookie is HMAC-signed with
`AUTH_SECRET` so it can't be hand-edited in devtools to claim a different
identity. See [`lib/session.ts`](lib/session.ts) for the detail.

If the team later wants real per-person login (so a name can't be picked by
anyone who reaches the URL), that's a bigger, separate change — swap this
cookie for a proper auth provider (e.g. NextAuth / Auth.js) keyed to the
same roster. Worth doing before the URL is ever handed to anyone outside
the team.
