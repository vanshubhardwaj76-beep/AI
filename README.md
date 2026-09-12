# Pipkin 🐣 — a cozy virtual-pet self-care companion

Take care of yourself, and a little friend grows. Pipkin is an original React Native + Expo app where
completing gentle self-care goals earns energy and XP for a small animal companion, who levels up,
goes on adventures, collects outfits, and cheers you on. No guilt trips, ever.

All branding, characters, artwork (procedural SVG), copy, and sounds are original.

## Features

| Area | What's included |
| --- | --- |
| Onboarding | Welcome → pick one of 5 original pets (Puffling, Mochi Cat, Ember Fox, Clover Bun, Pebble Penguin) → name → focus areas → free-text intent → recommended starter goals. Skippable. |
| Home | Animated pet (idle breathing, blinking, tap-to-wiggle, jump on level-up), mood line, energy + level bars, streak, today's goals, quick actions. |
| Goals | Create / edit / delete / pause / complete / undo. Name, description, category, frequency (daily / weekly / specific days), reminder time, difficulty, icon, colour, per-goal streaks. Full validation. |
| Rewards | XP + energy + coins per completion, streak bonus (capped so missing a day is never punishing), reward popup, level-up celebration, synthesised UI sounds. |
| Pet | Mood (happy / excited / sleepy / curious / proud / calm / tired) computed from context, friendship, XP, level titles, rename. |
| Adventures | 7 original locations with a timestamp-based state machine `IDLE → ON_ADVENTURE (6–8 h) → RETURNED → RESTING (2–4 h) → IDLE` that survives restarts. While away the pet is *gone* from home (away card with destination, countdown, progress); the adventure screen shows the pet walking in place over a seamless parallax-scrolling scene; on return a welcome-home sequence reveals random discoveries (common / uncommon / rare curios, coins, items, collectibles) and one of many original per-location stories; then the pet sleeps at home until rest ends. |
| Reward ledger | Every XP / energy / coin / friendship grant is a persisted `reward_transactions` record (source, refId, goalId, completionDate, streakBonus…). Undoing a goal reverses *exactly* its own transaction; grants are idempotent per refId, so restarts and double-taps never duplicate rewards. |
| Customisation | Hats, glasses, scarves, jackets, backpacks, toys, companions and 5 environments — drawn as SVG layers on the pet. Coin shop + level gating + adventure-only drops. |
| Journal | Daily / gratitude / mood / free entries with prompts, create / edit / delete / search / filter / by-date. |
| Mood check-in | 5-point check-in, supportive response, suggested activity, 14-day chart + calendar history. |
| Activities | 12 guided activities (breathing, mindfulness, reflection, movement) with step timers and a breathing animation. |
| Progress & Calendar | Streaks, completion rate, 30-day chart, mood chart, category breakdown; month calendar with visual indicators for goals / mood / journal. |
| Friends | Friend codes, view friend's pet, send reactions & encouragement. No leaderboards. Works offline with sample companions; real lookups when a backend is configured. |
| Settings | Account, pet, notifications (local, per-goal), light / dark / system theme, sound, haptics, privacy, JSON export, reset, delete account, about. |
| Auth | Guest mode by default. Email + Google via Supabase when configured; clean local fallback otherwise. Cloud backup / restore. |
| Persistence | SQLite on iOS / Android, AsyncStorage on web, behind one `StorageBackend` interface. Everything survives restarts. |

## Getting started

```bash
npm install
```

### Run

```bash
npm start          # Expo dev server (press w / a / i)
npm run web        # web at http://localhost:8081
npm run android    # Android emulator or device with Expo Go / dev build
npm run ios        # iOS simulator (macOS) or device
```

Notifications and haptics need a **development build** rather than Expo Go on recent SDKs:

```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

### Tests & type-check

```bash
npm test           # node:test suites for leveling, streaks, mood, storage and the full goal/reward loop
npm run typecheck  # tsc --noEmit (strict)
```

### Production builds

```bash
npm i -g eas-cli && eas login
eas build --platform android --profile production
eas build --platform ios --profile production
npx expo export --platform web      # static web build in dist/
```

Set `expo.ios.bundleIdentifier` / `expo.android.package` in `app.json` to your own identifiers before shipping.

### Environment variables (optional)

Copy `.env.example` to `.env`. The app is fully functional without a backend.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL — enables email/Google auth, cloud backup, real friends |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

Apply `supabase/schema.sql` to your project and enable the Google provider in Supabase Auth (redirect: `pipkin://auth/callback`).

## Architecture

```
app/                      Expo Router routes (file-based navigation)
  _layout.tsx             providers, bootstrap gate, onboarding redirect, reward popup
  (tabs)/                 Home · Goals · Pet · Journal · Profile
  onboarding/ goal/ journal/ adventure/ activity/ settings/ auth/
  mood.tsx mood-history.tsx progress.tsx calendar.tsx friends.tsx
src/
  components/ui           design-system primitives (Button, Card, Input, Sheet, Toast, …)
  components/pet          procedural SVG pets, accessories, environments, PetAvatar animations
  components/goals|home|journal|charts
  database/               StorageBackend interface + SQLite (native) / AsyncStorage (web) / memory (tests)
  store/                  Zustand stores per domain; every mutation writes through to the database
  services/               auth, sync, friends, notifications, export, sound — swappable backend seams
  data/                   original content: species, items, adventures, activities, goal templates, prompts
  utils/                  pure logic: leveling curve, streaks, pet mood, dates, validation, haptics
  hooks/                  app bootstrap, pet mood sync, today progress, notification scheduling
  theme/                  palette, light/dark tokens, spacing, typography, ThemeProvider
tests/                    node:test suites (run against the real stores with an in-memory backend)
scripts/generate-icons.js regenerates icon/splash assets procedurally
supabase/schema.sql       optional backend schema
```

**Data flow:** UI → store action → `getDatabase().collection(...)` write → store state update → UI.
Cross-domain effects (goal completion → pet XP/energy → profile coins → reward popup) happen inside the
store actions so they are testable without React.

**Design language:** warm cream / peach / mint palette, rounded cards, large type, spring animations via
Reanimated, accessible labels on every interactive element, light and dark themes.

## Pet animation states

`PetAvatar` takes a `state` prop (`HOME_IDLE | WALKING | HAPPY | EXCITED | SLEEPING | RESTING | CURIOUS | PROUD | TIRED`). Each state maps to a procedurally-built pixel pose (see `src/engine/pets.ts`, incl. a 4-frame walk cycle and closed-eye rest frames) plus container motion (walk bounce/sway, slow breathing, wiggle). `Environment` has a `scroll` mode for the travelling scene (far/mid/near layers loop right→left at different speeds).

## Notes

- Pipkin is not a medical tool and never guilt-trips: missed days simply pause streaks; the pet greets you with "Welcome back!".
- Google sign-in requires a configured Supabase project; email sign-in falls back to local mode with a clear notice.
