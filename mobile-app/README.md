# Pickzy

Offline-first random winner picker for Android and iOS. Create a project, add participants (typed, or imported from
`.xlsx` / `.csv` / `.txt`), spin an animated wheel, celebrate the winner, and keep a history of every draw.
English and বাংলা, light / dark / colorful themes. No account, no network: everything is stored on the device in SQLite.

Built with Expo SDK 58 · React Native 0.88 · React 19 · TypeScript (strict) · Expo Router · Unistyles 3 ·
i18next · expo-sqlite · Reanimated · react-native-svg · Lucide icons · Zustand · Jest + React Native Testing Library.

> **Not Expo Go.** Unistyles 3 and other native modules need a **development build** (`expo run:*` or EAS).

## Prerequisites

- [Bun](https://bun.sh) (package manager) and Node 20+
- Android: Android Studio + SDK, a device or emulator. iOS: macOS with Xcode.

## Getting started

```bash
bun install
bun run android        # builds and runs a dev build on Android (first run generates android/)
bun run ios            # macOS only
bun run start          # Metro for an already-installed dev build
bun run prebuild       # regenerate native projects from scratch
```

## Quality checks

```bash
bun run typecheck      # tsc --noEmit (strict)
bun run lint           # ESLint (expo config)
bun run test           # Jest: unit + integration (in-memory SQLite via sql.js)
bun run check:i18n     # EN / বাংলা key parity
bun run check          # typecheck + lint + tests
```

## Building with EAS

```bash
bunx eas-cli login
bunx eas-cli build --profile development --platform android   # dev client APK
bunx eas-cli build --profile preview --platform android       # installable APK
bunx eas-cli build --profile production --platform android    # Play Store .aab
```

`app.json` uses the package / bundle id `app.pickzy.mobile`; change it before publishing.

## Where things live

| Area | Location |
| --- | --- |
| Routes (thin files that render a screen) | `src/app/` |
| Feature code: `screens`, `components`, `hooks`, `services`, `repositories` | `src/features/{home,projects,participants,wheel,history,profile,app}` |
| Shared UI primitives (AppText, AppButton, AppModal, toasts, confetti…) | `src/components/` |
| Design tokens, themes, Unistyles config, fonts | `src/theme/` |
| SQLite schema, migrations, repositories | `src/database/` |
| File import (CSV / XLSX / TXT parsing, validation) | `src/import/` |
| Translations (`common`, `home`, `projects`, `wheel`, `history`, `profile`) | `src/i18n/locales/{en,bn}/` |
| Tests | `tests/unit`, `tests/integration`, helpers in `tests/helpers` |

## Behavior worth knowing

**Draw flow.** Pressing Spin picks the winner and **saves it first**; the wheel animation only visualizes the saved
result, so closing the app mid-spin can never change the outcome. A winner that hasn't been acknowledged blocks the
next spin. Finishing a draw stores a snapshot (project name, roster, winners) in History, so later edits or deletion of
the project don't rewrite the past. Optionally, winners can be removed from the project's list when the draw finishes.

**More than one winner.** After a winner is shown you can keep going: "Spin for 2nd place", "3rd place" and so on
(the winner count grows by one each time). Earlier winners come off the wheel for the rest of that draw while they stay
in the project's participant list; "Remove selected winners" in draw settings additionally deletes them from the project
when the draw is finished. With "Allow repeat winners" on, earlier winners stay on the wheel.

**Duplicate names.** Default policy is *keep*: every name is added and the duplicates are reported
("1 duplicates kept"). *Skip* leaves existing names out and reports the count. Blank lines and shortened long names are
reported too. Nothing is dropped silently.

**Import.** `.xlsx` is read with `fflate` plus a small XML reader (no SheetJS). Sheet and column selection and header
detection are supported. CSV handles quotes, CRLF and BOM and is parsed in chunks for large files; TXT is one name per line.

**Fairness.** Each spin chooses uniformly with `Math.floor(rng() * n)`, using `crypto.getRandomValues` when available.
This is unbiased but is not a certified or auditable lottery system.

**Fonts and Bengali.** Fonts are bundled. Noto Sans Bengali is used when the language is বাংলা or the text contains
Bengali characters; numbers are shown in Bengali digits when the language is বাংলা.

**Database.** Versioned with `PRAGMA user_version`; each migration runs in a transaction, and a database from a newer
app version is refused instead of being damaged.

## Known limitations

- The app has not been run on a physical device by its author; the automated tests cover logic and screens with
  mocked native modules, not real animation timing or native rendering.
- Run `bunx expo-doctor` and `bunx expo install --check` after `bun install` to confirm SDK-compatible versions.
- `react-hooks` compiler-style lint rules (`set-state-in-effect`, `refs`, `purity`) are warnings, not errors; the
  flagged patterns are intentional.
