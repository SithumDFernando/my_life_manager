# MyLife Manager — Project TODO

- [x] Design app logo and branding
- [x] Update theme.config.js with light minimalistic palette
- [x] Update icon-symbol.tsx with all needed icon mappings
- [x] Create database schema for all modules
- [x] Build PIN Setup/Entry screen with AsyncStorage persistence
- [x] Build Dashboard (Home) screen with module cards and stats
- [x] Build Daily To-Do screen with tasks, checkbox, carry-over from yesterday, achievement report
- [x] Build Accounts & Credentials module (add/view/edit/delete, categories, password mask)
- [x] Build Subscriptions module (add/view/edit, cost tracking, renewal dates)
- [x] Build Bio Data screen (name, education, DOB, phone, LinkedIn, GitHub, HackerRank)
- [x] Build Notes module (add/view/edit/delete, categories)
- [x] Build Competitions & Events module (dates, venues, results)
- [x] Build Venues module (location tracking)
- [x] Build Reading Tracker (books, research papers, progress, ratings, notes)
- [x] Build Achievements module (hackathon wins, awards, linked competitions)
- [x] Build Projects module (ongoing/finished, categories, GitHub repos, awards)
- [x] Build Service-Account Mapping (which Google/GitHub account for which service in which project)
- [x] Build bottom tab navigation (Dashboard, Daily, Projects, Tracker, More)
- [x] Add haptic feedback on primary actions
- [x] Test all flows end-to-end
- [x] Final polish and checkpoint

# Upgrade v1.5 — Bug Fixes & Improvements

- [x] Fix real-time data refresh (useFocusEffect on all screens)
- [x] Add edit/update for Accounts module
- [x] Add edit/update for Subscriptions module
- [x] Add edit/update for Competitions module
- [x] Add edit/update for Reading module
- [x] Add edit/update for Achievements module
- [x] Fix dark mode visibility (useColors tokens on all screens)
- [x] Fix missing tab icons
- [x] Add Backup/Restore (export/import JSON)
- [x] Fix Bio Data save feedback + add profile view on More tab
- [x] Link project service accounts to existing accounts
- [x] Dashboard auto-refresh on focus
- [x] Project edit functionality
- [x] Copy username/password to clipboard
- [x] Proper PIN Change flow (old PIN → new PIN)
- [x] Test all upgrades

# Upgrade v2 — Architecture, UI & Habits

## Phase 1: Foundation & UI Refactoring (Complete)
- [x] Install `@react-native-community/datetimepicker`
- [x] Update `lib/types.ts` for Location links (`mapUrl`)
- [x] Create reusable UI components (`BottomSheetModal`, `ScreenHeader`, `FormField`, `EmptyState`, etc.)
- [x] Build Full-Screen Notes Editor (with debounced auto-save)
- [x] Refactor target screens to use new modular UI components

## Phase 1.5: Interactive Pickers, Validation & Form UX (Complete)
- [x] Wire `DatePickerField` across all forms (Events, Competitions, Subscriptions, Projects, Reading, Achievements, Bio)
- [x] Add Web platform fallback support (`date-picker-field.web.tsx`) for browser HTML5 calendar/time pickers
- [x] Wire `LocationLinkButton` with Google Maps deep linking in Venues and Events
- [x] Add Event scheduling features: All-Day toggle, Start Time & End Time pickers
- [x] Fix `BottomSheetModal` scrolling hierarchy for long forms on Web & Mobile
- [x] Create cross-platform alert helper (`lib/alert.ts`) supporting `window.alert`/`window.confirm` on Web and native dialogs on Mobile
- [x] Implement comprehensive form validations and user warnings on Save across all modules

## Phase 2: Navigation & Habits Hub (Complete)
- [x] Reorganize Tab Bar (Dedicated Habits Tab + Projects moved to Tracker)
- [x] Build Habits Data Models & Storage Layer (`lib/types.ts` & `lib/storage.ts`)
- [x] Build Habits UI (Positive, Avoidance, Numeric, Weekly Quota e.g. 3x/week)
- [x] Build Gamification Engine (XP, Levels, Streak Shields, 24h Grace Window)

## Phase 2.5: Strategic Hub, Daily Unified Execution & Full CRUD (Complete)
- [x] Update Master Targets schema and log full CRUD storage
- [x] Rebrand Habits tab to Improve tab
- [x] Build Improve Hub (Master Targets management, Analytics views)
- [x] Refactor Daily tab (Unified Tasks + Habits checklist, 24h grace window)

## Phase 3: Developer Info, Feedback & Help
- [ ] Build Developer Showcase & Feedback Modal with Quality Rating Sliders
- [ ] Build In-App Help Center & Knowledge Base (`app/(more)/help.tsx`)

## Phase 4: Backup & Verification
- [ ] Update JSON Backup/Restore for Habit Keys
- [ ] Standalone APK Testing
