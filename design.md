# MyLife Manager — Mobile App Design Plan

## Design Philosophy
- **Light themed, minimalistic** — Clean white/light gray backgrounds, subtle shadows, generous whitespace
- **Apple HIG aligned** — Feels like a first-party iOS app with native feel
- **One-handed usage** — Primary actions at bottom, navigation via bottom tab bar
- **Color Palette:**
  - Primary: `#5B8DEF` (a calm blue) — accent/buttons/tabs
  - Background: `#FFFFFF` (pure white)
  - Surface: `#F7F8FA` (very light gray-blue)
  - Foreground: `#1A1A2E` (near-black with slight blue tint)
  - Muted: `#8B8FA3` (soft gray)
  - Border: `#E8EAED` (light divider)
  - Success: `#34D399` (mint green)
  - Warning: `#FBBF24` (amber)
  - Error: `#F87171` (soft red)

## Screen List

### Authentication
1. **PIN Setup Screen** — First-time PIN creation (6 digits)
2. **PIN Entry Screen** — Subsequent launches require PIN

### Main Navigation (Bottom Tab Bar — 5 Tabs)
3. **Dashboard (Home)** — Overview cards showing all modules at a glance
4. **Daily** — To-do list screen (today's tasks + yesterday's report)
5. **Projects** — Projects list with filters (ongoing/finished), service-account mapping
6. **Tracker** — Accounts, Subscriptions, Reading, Achievements (sub-sections)
7. **More** — Bio Data, Notes, Competitions, Events, Venues, Settings

### Detail/Action Screens (Stacked Navigation)
8. **Account Detail Screen** — View/edit a specific account credential
9. **Subscription Detail** — View/edit a subscription with cost & renewal info
10. **Project Detail Screen** — Full project view with linked services, repos, awards
11. **Competition Detail** — Competition info with linked projects/awards
12. **Reading Item Detail** — Book/paper details, progress, notes
13. **Achievement Detail** — Full achievement info with linked competition
14. **Service Account Mapping** — Visual map of which account is used where
15. **Event Detail** — Event info with date, venue, notes
16. **Bio Data Edit** — Editable profile with all personal info fields

### Add/Edit Forms (Modals or Sheets)
17. **Add Account Form**
18. **Add Subscription Form**
19. **Add Project Form**
20. **Add Competition Form**
21. **Add Reading Item Form**
22. **Add Achievement Form**
23. **Add Event Form**
24. **Add Venue Form**
25. **Add Task Form** (for daily to-do)

## Primary Content & Functionality Per Screen

### Dashboard
- Greeting with current date
- Quick stats: today's tasks, active projects, upcoming subscriptions due, recent readings
- Navigation cards to each module
- Daily to-do summary widget

### Daily To-Do
- Today's date header
- List of tasks with checkbox (completed/pending)
- "Yesterday's Report" section (appears on first open of the day)
- Quick-add task input at bottom
- Tasks auto-clear every morning, yesterday's completion summary shown

### Projects
- Segmented control: All / Ongoing / Finished
- Project cards with title, category, status, GitHub link
- Service-account mapping: shows which Google/GitHub account is used for which service
- Linked competitions and achievements

### Tracker
- Tab-like sections: Accounts, Subscriptions, Reading, Achievements
- Accounts: grouped by category (Email, Social, Website) with username/password fields
- Subscriptions: cost summary, next renewal date, active/expired toggle
- Reading: books and research papers with progress, rating, notes
- Achievements: hackathon wins, awards with date, place, competition link

### More
- Bio Data: name, DOB, education, phone, LinkedIn, GitHub, HackerRank
- Notes: searchable notes list with categories
- Competitions: upcoming and past, with dates and results
- Events: calendar of events with venues
- Venues: location details
- Settings: PIN change, theme, backup

## Key User Flows

### Flow 1: First Launch
1. App opens → PIN Setup Screen → Create 6-digit PIN → Confirm PIN → Dashboard

### Flow 2: Daily Task Management
1. Open app → Enter PIN → Dashboard → Tap "Daily" tab
2. See yesterday's achievement report → Tap to carry over unfinished tasks
3. Add new tasks → Check off completed tasks throughout the day

### Flow 3: Track a Project
1. Dashboard → Tap "Projects" tab → Tap "+" → Fill form (title, category, status, repo, services used)
2. For each service (Cloud, Supabase, Clerk, Vercel, Claude, Gemini): specify which Google/GitHub account
3. Link to competitions and achievements
4. View project → See all linked services and accounts

### Flow 4: Track a Subscription
1. Dashboard → Tap "Tracker" → Subscriptions section → Add subscription
2. Enter name, cost, renewal date, category
3. Dashboard shows upcoming renewals

### Flow 5: Track Credentials
1. Dashboard → Tap "Tracker" → Accounts section → Add account
2. Enter account type, name, username, password (masked), URL
3. View account → Eye icon to reveal password → Copy button

## Icon Mapping (Material Icons)
- Dashboard: `dashboard` → `dashboard`
- Daily: `event_note` → `event_note`  
- Projects: `folder_special` → `folder_special`
- Tracker: `collections_bookmark` → `bookmarks`
- More: `more_horiz` → `more_horiz`
