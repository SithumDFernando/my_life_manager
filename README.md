# MyLife Manager

**MyLife Manager** is a comprehensive, offline-first personal life management mobile application built with React Native and Expo. It serves as an all-in-one centralized hub to manage your daily tasks, habits, projects, finances, and personal information securely on your device.

## 🚀 Features

- 🔐 **Secure Vault**: Manage account credentials (passwords, logins) and bio data securely behind a 6-digit PIN lock.
- 🎯 **Strategic Hub & Habits**: Define high-level master targets with flexible deadlines, and link daily/weekly habits to them. Features a comprehensive gamification engine with XP, levels, and streak analytics.
- 📋 **Daily Execution**: A unified daily checklist combining your daily to-do tasks and habits. Unfinished tasks carry over seamlessly to the next day. Includes a 24-hour grace window for logging yesterday's habits.
- 💰 **Subscriptions & Finances**: Track active subscriptions, calculate monthly costs, and monitor renewal dates.
- 📁 **Projects & Tech Stack**: Manage personal projects, track GitHub repos, and map specific service accounts (e.g., AWS, Vercel) to individual projects.
- 📖 **Knowledge & Tracking**: Track reading progress (books, papers), log upcoming competitions/events, and record personal achievements (hackathons, certifications).
- 📝 **Native Notes**: A full-screen markdown-supported note editor with categorized quick notes.
- 💾 **100% Offline-First**: All data is stored locally on the device using `AsyncStorage`. Includes full JSON export/import for manual backups.

## 🛠️ Technology Stack

- **Framework**: React Native + Expo (SDK 54)
- **Routing**: Expo Router (v6) file-based routing
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS) + dynamic light/dark mode custom hooks
- **Storage**: AsyncStorage (Offline-First Key-Value Store)

## 🏃 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (v9+)
- Expo Go app on your physical device (iOS/Android)

### Installation & Running

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the Metro bundler:**
   ```bash
   pnpm dev:metro
   ```

3. **Run on your device:**
   - Open **Expo Go** on your phone.
   - Scan the QR code presented in the terminal.
   - *Ensure your phone and computer are on the same Wi-Fi network.*

### Building for Production
To generate a standalone APK or iOS IPA:
```bash
# Generate native Android/iOS folders
npx expo prebuild

# Build via EAS (Expo Application Services)
npx eas-cli build --platform android
```

## 📁 Architecture

- `app/`: Expo Router file-based screens (Tabs, Modals, Add Forms).
- `components/ui/`: Modular, reusable UI components (e.g., `BottomSheetModal`, `DatePickerField`, `SuggestionField`, `IconSymbol`).
- `lib/`: Core business logic, types, and the `AsyncStorage` data layer.
- `hooks/`: Custom React hooks (`useColors`, `useColorScheme`).
- `docs/`: In-depth architecture guides (`codebase_analysis.md`) and project roadmaps (`todo.md`).

> **Note on Backend**: The repository contains a `server/` directory and `drizzle/` ORM configurations. These are artifacts generated from the base template for Manus OAuth. They are **not** utilized for the core functionality of MyLife Manager, which operates entirely offline.

## 🤝 Contribution Guidelines
When contributing to this project, please refer to the `AGENTS.md` file located at the root of the workspace. It contains strict rules regarding UI paradigms, data fetching with `useFocusEffect`, component standards, and safe cross-platform API usage.
