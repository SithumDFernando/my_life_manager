# MyLife Manager - Agent Guidelines

These rules and constraints must be followed whenever working within this project to maintain architectural integrity, UI consistency, and correct offline behavior.

## 1. UI Component Standards
- **Dates & Times**: Always use the custom `DatePickerField` (`@/components/ui/date-picker-field`) for date or time inputs. NEVER use raw text inputs (`FormField` or `<TextInput>`) for dates, and NEVER use `<input type="date">` directly unless modifying the Web fallback.
- **Icons**: The app uses `IconSymbol` which maps Apple's SF Symbols to Google Material Icons. Before using an icon, you MUST verify it exists in `components/ui/icon-symbol.tsx`. If it is missing, you must add the mapping there first.
- **Modals**: Always use `BottomSheetModal` (`@/components/ui/bottom-sheet-modal`) for interactive forms, detail views, and edit screens to preserve the iOS-style card experience.
- **Form Inputs**: 
  - Use `FormField` for standard text inputs.
  - Use `SuggestionField` for inputs where options can be inferred from past entries (like categories or names).
  - Use `CategoryPillSelector` for predefined small lists.

## 2. Styling & Theming
- **Dynamic Colors**: Always use `const colors = useColors()` to fetch the active theme palette. Apply these colors via inline styles (`{ color: colors.foreground, backgroundColor: colors.surface }`).
- **Never Hardcode Hex**: Do NOT hardcode hex colors (e.g. `#FFFFFF` or `#000000`) unless you are designing highly specific visual elements like gamification badges that must ignore the device's light/dark mode.
- **NativeWind**: Use Tailwind/NativeWind utility classes (`className="px-5 mb-4"`) strictly for spacing, layout, padding, and margins. All color management MUST be done via the `colors` hook.

## 3. Data Layer & Architecture (CRITICAL)
- **Offline First**: The entire app functions offline using `AsyncStorage`. All data operations (CRUD) MUST go through `lib/storage.ts` or `lib/habit-storage.ts`.
- **No Backend Modifications**: Never modify the `server/` directory, `drizzle/` directory, or any OAuth files to implement core app features. The Express backend is solely a Manus template artifact for OAuth and is ignored by the core app.
- **Strict Typing**: All TypeScript interfaces must be strictly defined and maintained in `lib/types.ts`. Do not use `any` types for data storage.

## 4. Data Fetching & Syncing
- **Realtime Tab Sync**: To ensure data stays fresh when switching tabs, always load data inside `useFocusEffect`:
  ```typescript
  import { useFocusEffect } from "expo-router";
  
  const loadData = useCallback(async () => {
    // ... fetch from storage
  }, []);
  
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  ```

## 5. Platform Specifics (Native vs Web)
- **Haptic Feedback**: Always trigger haptic feedback on successful actions (saving, completing tasks), but it MUST be wrapped in a platform check since `expo-haptics` crashes on Web:
  ```typescript
  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  ```
- **Alerts**: Always use the cross-platform `showAlert` helper from `lib/alert.ts` instead of `Alert.alert` (which crashes on Web).
