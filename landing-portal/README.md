# Pickzy (Web)

Offline-first random winner picker with a spin wheel. This is the Next.js version of the Pickzy mobile app:
same rules, same data model, built with **Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and shadcn/ui**.
Everything is stored in your browser (IndexedDB). No account, no server, no network needed after the first load.

English and বাংলা, light / dark / colorful themes, installable as a normal website.

## Prerequisites

- [Bun](https://bun.sh) 1.2+ (Node.js 20.9+ also works for the Next.js tooling)

## Getting started

```bash
bun install
bun dev            # http://localhost:3000
```

## Quality checks

```bash
bun run typecheck  # next typegen + tsc --noEmit
bun run lint       # eslint
bun run test       # vitest (unit, integration, component tests)
bun run build      # production build
bun start          # serve the production build
```

## Where things live

```
src/
  app/                    Routes. Thin server pages that render one client screen each.
    (app)/                Pages inside the app shell (top nav on desktop, bottom nav on phones)
      page.tsx            Home
      projects/           List, /new, /[projectId]
      draw/[drawId]/      The wheel, and /result
      history/            List and /[historyId]
      profile/
  components/
    ui/                   shadcn/ui components (Button, Dialog, Sheet, Select, Tabs, ...)
    shared/               Reusable building blocks (PageHeader, EmptyState, ConfirmDialog, PersonAvatar, ...)
    providers/            Theme, language and startup providers
  features/               One folder per feature: components/, hooks/, services/
    projects  participants  import  wheel  history  profile  home  app
  lib/db/                 Dexie database, transactions and repositories (the only code that touches IndexedDB)
  lib/services.ts         Wires repositories into services; `services-context.tsx` provides them to React
  i18n/                   i18next setup and the en / bn translation files
  store/                  Small Zustand store (preferences, startup state, "data changed" counter)
tests/                    unit/, integration/ (real services on fake-indexeddb), components/ (Testing Library)
```

Layers, from the bottom: **repositories** (database access) -> **services** (rules and validation, no React) ->
**hooks** (React glue) -> **components** (UI only). Services are plain TypeScript, so the rules are tested without a UI.

## Behavior worth knowing

**Draw flow.** Pressing Spin picks the winner and **saves it first**; the wheel animation only visualizes the saved
result, so closing the tab mid-spin can never change the outcome. A winner that hasn't been acknowledged blocks the
next spin and is shown again if the page is reopened. Finishing a draw stores a snapshot (project name, roster,
winners) in History, so later edits or deletion of the project don't rewrite the past.

**More than one winner.** After a winner is shown you can keep going: "Spin for 2nd place", "3rd place" and so on
(the winner count grows by one each time). Earlier winners come off the wheel for the rest of that draw while they stay
in the project's participant list. "Remove selected winners" in draw settings additionally deletes them from the
project when the draw is finished. With "Allow repeat winners" on, earlier winners stay on the wheel.

**Duplicate names.** Default policy is *keep*: every name is added and the duplicates are reported. *Skip* leaves
existing names out and reports the count. Blank lines and shortened long names are reported too. Nothing is dropped silently.

**Import.** `.xlsx` is read with `fflate` plus a small XML reader (no SheetJS). Sheet and column selection and header
detection are supported. CSV handles quotes, CRLF and BOM; TXT is one name per line.

**Fairness.** Each spin chooses uniformly with `crypto.getRandomValues` when available. This is unbiased but is not a
certified or auditable lottery system.

**Fonts and Bengali.** Inter and Noto Sans Bengali are bundled with `@fontsource-variable` (no Google Fonts request).
Numbers and dates use Bengali digits when the language is বাংলা.

**Themes.** Handled by `next-themes` (a class on `<html>`), so the saved theme is applied before the page paints.

**Storage.** Data is kept per browser profile. Clearing site data removes it, and some private windows block
IndexedDB; the app then shows a clear message instead of failing silently. The database is versioned, and data
written by a newer version is refused rather than damaged.

## About the shadcn/ui components

The files in `src/components/ui/` follow shadcn/ui's code, Tailwind v4 tokens and `radix-ui` imports. They were
written by hand because the shadcn registry was not reachable while building. You can add more with
`bunx shadcn@latest add <component>` as usual; `components.json` is included.

## Known limitations

- Automated tests cover logic and screens in jsdom, and the production build was smoke-tested once in headless
  Chromium (create project, spin, 2nd place, result, history, themes, Bengali on a phone-sized screen). It has not
  been tried on Safari or Firefox or real phones.
- History and the project list read everything from IndexedDB in one go; this is fine for thousands of names but is
  not designed for hundreds of thousands.
