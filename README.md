# Pickzy Monorepo

Pickzy is an offline-first random winner picker ecosystem. It provides fair, transparent, and animated lottery/raffle draws with customizable rules, multiple winners (1st place, 2nd place, etc.), participant file import (CSV, XLSX, TXT), frozen draw history snapshots, multilingual support (English and Bengali), and responsive themes (Light, Dark, and Colorful).

The repository is structured as a monorepo managed with [Bun](https://bun.sh).

---

## Projects in this Monorepo

| Directory | Platform / Stack | Description | Status |
| --- | --- | --- | --- |
| `mobile-app/` | React Native 0.88, Expo SDK 58, TypeScript, SQLite, Unistyles 3 | Native Android and iOS mobile app with local SQLite storage | Active |
| `landing-portal/` | Next.js 16 (App Router), React 19, Tailwind CSS v4, Dexie (IndexedDB) | Web portal and browser application with client-side IndexedDB | Active |
| `admin-portal/` | Web | Administrative dashboard for portal operations | Planned |
| `server/` | Node.js / Bun backend | Sync and cloud backend services | Planned |

---

## Prerequisites

- [Bun](https://bun.sh) v1.2+ (Primary package manager and task runner)
- [Node.js](https://nodejs.org) v20+
- Mobile Development:
  - Android Studio + Android SDK (API 34+) and ADB for Android
  - Xcode and CocoaPods for iOS (macOS only)
- Web Development:
  - Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Getting Started

Clone the repository and install root and package dependencies:

```bash
# Clone the repository
git clone git@github.com:AbdullahAlMaksud/pickzy-monorepo.git
cd pickzy-monorepo

# Install root tooling (Husky, Commitlint)
bun install

# Install sub-project dependencies
cd mobile-app && bun install && cd ..
cd landing-portal && bun install && cd ..
```

---

## Monorepo Commands

You can run commands directly from the monorepo root:

### Mobile App Commands

```bash
bun prebuild           # Run expo prebuild --clean for mobile-app
bun android            # Run native Android debug build on connected device/emulator
bun ios                # Run native iOS build (macOS only)
bun start              # Start Metro bundler with dev client for mobile-app
bun run doctor         # Run expo-doctor checks on mobile-app
```

### Web Portal Commands

```bash
bun run dev:web        # Start Next.js development server at http://localhost:3000
bun run build:web      # Build static and server assets for landing-portal
bun run start:web      # Start Next.js production server
```

### Quality & Validation

```bash
bun run validate       # Run full quality checks across both mobile-app and landing-portal
bun run check          # Alias for bun run validate
bun run typecheck      # TypeScript typecheck for both projects
bun run lint           # ESLint verification for both projects
bun run test           # Run Jest (mobile) and Vitest (web) suites
```

---

## Git Workflow & Quality Gates

This repository enforces commit message standards and automated validation through **Husky** and **Commitlint**:

### 1. Pre-commit Hook (`.husky/pre-commit`)
Before any commit is created, Husky runs `bun run validate`:
- Typechecks `mobile-app` and `landing-portal`.
- Runs linters across both codebases.
- Executes all unit and integration test suites (over 340 tests).

### 2. Commit Message Hook (`.husky/commit-msg`)
Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Examples:
  - `feat(mobile-app): overhaul UI themes and font picker`
  - `fix(mobile-app): update splash icon asset path`
  - `chore: configure husky and commitlint`

---

## EAS Cloud Builds (Mobile)

EAS Build configurations are defined in `mobile-app/eas.json`:

```bash
cd mobile-app

# Development build (custom dev client APK)
bunx eas-cli build --profile development --platform android

# Preview build (installable APK for testing)
bunx eas-cli build --profile preview --platform android

# Production build (.aab for Google Play Store)
bunx eas-cli build --profile production --platform android
```

---

## Architecture Overview

- **Offline-First:** All data operations are completely local. The mobile app uses SQLite (`expo-sqlite`), and the web app uses IndexedDB (`dexie`). No user accounts, credentials, or network connections are required for core features.
- **State & Rules Engine:** Participant normalization, duplicate handling policies, uniform random selection (`crypto.getRandomValues`), and multi-stage draw sessions are decoupled into testable services.
- **Safety First:** The winner is committed to the local database before the wheel animation starts, ensuring interruptions (app close, crash, or tab refresh) never alter draw results.
- **Localization:** Native support for English (`en`) and Bengali (`bn`) with Bengali numeral rendering and localized font pairings.

---

## License

Private repository. All rights reserved.
