# Pickzy Mobile App

Offline-first random winner picker for Android and iOS. Create a project, add participants (manually typed or imported from `.xlsx` / `.csv` / `.txt`), spin an animated wheel, celebrate the winner, and maintain a permanent history of every draw.

Supports English and Bengali (বাংলা), with Light, Dark, and Colorful themes. No account, login, or network connection required: all data is stored locally on the device using SQLite.

Built with **Expo SDK 58**, **React Native 0.88**, **React 19**, **TypeScript (strict)**, **Expo Router**, **Unistyles 3**, **i18next**, **expo-sqlite**, **Reanimated**, **react-native-svg**, **Lucide icons**, **Zustand**, and **Jest + React Native Testing Library**.

> **Note on Expo Go:** Unistyles 3 and custom native modules require a **development build** (`expo run:android`, `expo run:ios`, or EAS Build). This project does not run inside standard Expo Go.

---

## Prerequisites

- [Bun](https://bun.sh) (v1.2+) and Node.js 20+
- Android: Android Studio, Android SDK (API 34+), and a connected physical device or emulator.
- iOS: macOS with Xcode and CocoaPods.
- EAS CLI (for cloud builds): `bun add -g eas-cli` or `bunx eas-cli`.

---

## Getting Started

You can run commands either from the monorepo root or from within the `mobile-app` directory:

```bash
# From within mobile-app:
bun install
bun run android        # Compile and install native Android debug build
bun run ios            # Compile and install iOS build (macOS only)
bun run start          # Start Metro bundler with dev client support
bun run prebuild       # Clean and regenerate android/ and ios/ native directories
```

Or from the monorepo root:

```bash
bun prebuild           # Prebuild mobile-app
bun android            # Launch Android build
bun start              # Launch Metro bundler
```

---

## Quality Checks

All quality gates must pass before commits:

```bash
bun run typecheck      # TypeScript typecheck (tsc --noEmit, strict mode)
bun run lint           # ESLint verification
bun run test           # Jest unit and integration test suite (16 suites, 192 tests)
bun run check:i18n     # Key parity verification between English and Bengali
bun run check          # Runs typecheck, lint, and tests in sequence
bun run doctor         # Runs expo-doctor diagnostics
```

---

## Building with EAS

Build configurations are maintained in `eas.json` using project identifier `app.abdullahalmaksud.pickzy`:

```bash
# Log in to Expo account
bunx eas-cli login

# Custom Development Client (for local development and debugging)
bunx eas-cli build --profile development --platform android

# Preview Build (installable standalone APK for device testing)
bunx eas-cli build --profile preview --platform android

# Production Build (signed .aab bundle ready for Google Play Store release)
bunx eas-cli build --profile production --platform android
```

---

## Directory Structure

| Directory / File | Description |
| --- | --- |
| `src/app/` | File-based routing with Expo Router |
| `src/features/home/` | Home dashboard, recent projects, statistics, and quick-action cards |
| `src/features/projects/` | Project list, creation, editing, and deletion |
| `src/features/participants/` | Participant management, duplicate handling, and bulk import |
| `src/features/wheel/` | Animated spin wheel, draw settings, and winner reveal modal |
| `src/features/history/` | Completed draw session history and detailed snapshot viewer |
| `src/features/profile/` | Theme selection (Light, Dark, Colorful), language picker, font sizes |
| `src/components/ui/` | Shared primitives: AppButton, AppCard, AppInput, AppModal, Icon, AppText |
| `src/components/layout/` | ScreenContainer, ScreenHeader, BottomNavigation |
| `src/theme/` | Design tokens, color palettes, Unistyles configuration, and typography |
| `src/database/` | SQLite schema, migration runner, transactions, and repositories |
| `src/import/` | File parser services for CSV, XLSX, and TXT rosters |
| `src/i18n/` | i18next configuration and localization resources (`en`, `bn`) |
| `public/images/` | App icons, adaptive icons, and splash screen graphics |
| `tests/` | Unit and integration test suites covering services, database, and screens |

---

## Core Behavior & Architecture

### Transaction-Safe Draw Flow
Pressing **Spin** selects the winner and **commits the result to SQLite first**. The wheel animation only visualizes the saved winner. Closing or force-quitting the app mid-spin will never alter or drop the outcome. An unacknowledged winner prevents subsequent spins until dismissed. When the draw completes, an immutable snapshot (roster, project details, timestamps, winners) is archived in History.

### Multi-Winner Draws
After a winner is declared, the session allows continuing for subsequent placements ("Spin for 2nd place", "Spin for 3rd place", etc.). Prior winners are removed from the active wheel for the remainder of the draw while remaining in the project roster. Optionally, enabling "Remove selected winners" in draw settings removes winners from the project roster permanently once the draw concludes.

### Duplicate Handling Policies
- **Keep (Default):** Retains all names entered or imported, reporting duplicates in the summary dialog.
- **Skip:** Filters out duplicate names within the batch or matching existing participants in the project.
- Blank rows are ignored, and excessively long names are sanitized according to defined length constraints.

### Native File Import
- **XLSX:** Parsed via `fflate` and a lightweight XML decoder without relying on bulky external dependencies. Supports sheet selection and header detection.
- **CSV:** Handles multi-line quotes, varying delimiters, CRLF line endings, and UTF-8 byte order marks (BOM).
- **TXT:** Standard line-by-line roster ingestion.

### Fairness & RNG
Winner selection uses unbiased index mapping (`Math.floor(rng() * count)`) driven by `crypto.getRandomValues`.

### Localization & Bengali Support
- Full interface localization in English (`en`) and Bengali (`bn`).
- Numbers and dates dynamically use Bengali numerals when the active locale is Bengali.
- Bundled Noto Sans Bengali and Anek Bangla typefaces ensure accurate character rendering and conjunct shaping.

### Theming System
- Supports Light, Dark, and Colorful themes via Unistyles.
- Bottom navigation bar seamlessly adapts to dark mode using elevated surface styling with high-contrast active icons and indicators.

---

## Known Guidelines

- Automated tests execute in an in-memory SQLite environment (`sql.js`) with mocked native device APIs.
- React Native Compiler warnings for intentional synchronization effects (`set-state-in-effect`, `refs`) are treated as non-blocking warnings.
- Always run `bun run check` prior to submitting code to ensure cross-module type and test integrity.
