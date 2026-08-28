# Mobile App Diagnostics & Resolution Report: Theming System & Android Startup Crashes

**Project:** MyLife Manager (`com.app.mylifemanager`)  
**Technology Stack:** React Native 0.81, Expo SDK 54 (Expo Router v6), NativeWind v4, TypeScript, EAS Build  
**Target Environments:** Web Preview (Metro), Android Native (Samsung Galaxy S23 Ultra, Android 14/15, 64-bit ARM)  
**Date:** August 28, 2026  

---

## Executive Summary

During the development and deployment lifecycle of **MyLife Manager**, two major architectural bugs were encountered:
1. **Light/Dark Mode System Failure:** Selecting "Light Mode" inside the application failed to switch the UI theme when accessed via the web/Metro dev server, leaving the interface stuck in Dark Mode.
2. **Immediate Android App Startup Crash ("App Has a Bug"):** When built into a standalone production `.apk` via EAS Build and installed on physical Android hardware (Samsung Galaxy S23 Ultra), the application crashed instantaneously on startup with the OS error *"Something went wrong with MyLife Manager. MyLife Manager closed because this app has a bug"*.

This document details the complete end-to-end diagnostic process, root-cause analyses, initial/interim decisions (including false leads and why they occurred), and the permanent engineering solutions implemented.

---

## Part 1: Light/Dark Mode Theming Inoperability

### 1.1 Problem Statement & Symptoms
- Users navigating to **More → Appearance** selected **"Light Mode"**, but the application interface remained dark (`#151718` background, `#1e2022` surface cards, white text).
- The theme toggle state in AsyncStorage updated to `"light"`, yet visual components did not respond.

---

### 1.2 Initial Diagnostics & Interim Hypotheses (False Leads)

#### Hypothesis A: NativeWind v4 CSS Variable Format
- **Observation:** NativeWind v4 uses CSS variables referenced in `tailwind.config.js` via `var(--color-...)`.
- **Initial Fix:** In `lib/theme-provider.tsx`, the `vars({...})` call was using un-prefixed keys (e.g., `"color-background"` instead of `"--color-background"`).
- **Result:** While fixing CSS variable names was necessary for Tailwind utility classes, the app *still* failed to toggle to light mode on the web preview.

#### Hypothesis B: Navigation Stack Container Styles
- **Observation:** Expo Router nested navigators (`(more)`, `(add)`, `(pin-lock)`) lacked explicit `contentStyle` properties.
- **Initial Fix:** Added `contentStyle: { backgroundColor: colors.background }` across all nested stack layouts.
- **Result:** Pushed screens received theme colors, but the root palette itself was still resolving as dark mode.

---

### 1.3 The True Root Cause: Platform-Specific File Resolution (`.web.ts`)

When tracing the `useColors()` hook:

```typescript
// hooks/use-colors.ts
import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const colorSchema = useColorScheme();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "light") as ColorScheme;
  return Colors[scheme];
}
```

The import `./use-color-scheme` has two files in the workspace:
1. `hooks/use-color-scheme.ts` (Native implementation):
   ```typescript
   import { useThemeContext } from "@/lib/theme-provider";
   export function useColorScheme() {
     return useThemeContext().colorScheme;
   }
   ```
2. `hooks/use-color-scheme.web.ts` (Legacy Expo starter template for web):
   ```typescript
   import { useEffect, useState } from "react";
   import { useColorScheme as useRNColorScheme } from "react-native";

   export function useColorScheme() {
     const [hasHydrated, setHasHydrated] = useState(false);
     useEffect(() => { setHasHydrated(true); }, []);
     const colorScheme = useRNColorScheme();
     if (hasHydrated) {
       return colorScheme;
     }
     return "light";
   }
   ```

#### Why it broke:
- React Native Web/Metro prioritizes `.web.ts` extensions over `.ts` on web builds.
- Therefore, on Web, `useColors()` was importing `hooks/use-color-scheme.web.ts`.
- `use-color-scheme.web.ts` called `useRNColorScheme()` directly from `react-native-web`, **completely bypassing `ThemeProvider` and `ThemeContext`**.
- Because the developer's computer/browser was set to Dark OS mode, `useRNColorScheme()` continuously returned `"dark"`, completely overriding any in-app theme selection.

---

### 1.4 Solution Implemented

1. **Updated `hooks/use-color-scheme.web.ts`**:
   Replaced the standalone React Native Web hook with direct consumption of `useThemeContext()`:
   ```typescript
   import { useThemeContext } from "@/lib/theme-provider";

   export function useColorScheme() {
     return useThemeContext().colorScheme;
   }
   ```
2. **Dynamic Web Body Synchronization in `lib/theme-provider.tsx`**:
   Added programmatic synchronization for web DOM elements so `document.body` background and text colors update simultaneously upon theme changes.
3. **Appearance Listener for System Theme Sync**:
   Added `Appearance.addChangeListener` to support real-time transitions when the user selects `"system"` mode.

---

## Part 2: Standalone Android APK Startup Crash

### 2.1 Problem Statement & Symptoms
When building the APK via EAS (`eas build -p android --profile preview`):
1. **Play Protect Warning on Install:**
   > *"App blocked to protect your device; play protect hasn't seen an app from this developer before. it may be unsafe"*
   - **Diagnosis:** Normal Android behavior for side-loaded debug/preview binaries not published to Google Play. User clicks *"Install anyway"*.
2. **Immediate Crash on App Launch:**
   > *"Something went wrong with MyLife Manager. MyLife Manager closed because this app has a bug. Try updating this app after its developer provides a fix for this error [Got it]"*
   - **Diagnosis:** Fatal native exception or unhandled JS runtime error executing prior to the first frame render in `AppEntry`.

---

### 2.2 Phase 1 Diagnostics & Initial Fixes Attempted (Builds 1 & 2)

#### 1. Experimental React Compiler Removal
- **Hypothesis:** `app.config.ts` had `experiments: { reactCompiler: true }`. In React Native 0.81 (React 19) with Hermes engine, React Compiler produces invalid bytecode optimizations when transpiling Reanimated worklets and NativeWind interop classes.
- **Action Taken:** Removed `reactCompiler: true` from `app.config.ts`.

#### 2. Cold-Boot Safe Area Inset Hardening
- **Hypothesis:** In `app/_layout.tsx`, `initialWindowMetrics.insets` was accessed directly (`metrics.insets.top`). On Android cold-boot (specifically Samsung OneUI), window metrics can be `undefined` before native decor views initialize. Accessing properties on undefined caused a fatal `TypeError`.
- **Action Taken:** Replaced with safe null-coalescing fallbacks (`raw?.top ?? 0`).

#### 3. Native Base URL Fallback
- **Hypothesis:** `constants/oauth.ts` returned `""` on native, causing tRPC `httpBatchLink` to initialize with invalid relative URL `"/api/trpc"`.
- **Action Taken:** Provided absolute fallback URL `https://api.mylifemanager.local`.

#### 4. Removal of Unused Native Plugins from `app.config.ts`
- **Action Taken:** Removed `expo-audio` and `expo-video` plugin configurations.

#### Result of Phase 1:
The second APK build was produced (`build id: be13bbc7-6801-4ac7-bb28-5b8d1b759382`), but the application **still crashed on launch**. While the Phase 1 fixes resolved potential JavaScript crashes, a **native binary level incompatibility** was still causing a fatal exception during Android JVM/NDK initialization.

---

### 2.3 Phase 2 Diagnostics: Deep-Dive with `expo-doctor`

To isolate the native binary level crash, we executed the Expo SDK Diagnostic Tool (`npx expo-doctor@latest`).

The diagnostic scanner reported:

```text
✖ Check that required peer dependencies are installed
Missing peer dependency: expo-asset
Required by: expo-audio
Advice: Install missing required peer dependency with "npx expo install expo-asset"
Your app may crash outside of Expo Go without this dependency. Native module peer dependencies must be installed directly.

✖ Check that packages match versions required by installed Expo SDK
❗ Major version mismatches
package          expected    found    
expo-clipboard   ~8.0.8      57.0.1
```

---

### 2.4 The Ultimate Root Causes: Native Module & ABI Incompatibilities

#### Root Cause 1: `expo-clipboard` Invalid Major Version (`57.0.1`)
- **What happened:** In `package.json`, `expo-clipboard` was specified as `"^57.0.1"`.
- **Why it crashed Android:** Expo SDK 54 is built against `expo-clipboard ~8.0.8`. Version `57.0.1` was an invalid/out-of-band version containing incompatible Android native Kotlin/C++ bindings. During APK startup, Android's `ClassLoader` failed to link native JNI methods, triggering an immediate native `UnsatisfiedLinkError` / `NoClassDefFoundError` before React Native could start.

#### Root Cause 2: Missing Native Peer Dependency in `expo-audio`
- `expo-audio` was listed in `package.json` without its required native companion `expo-asset`. Outside Expo Go, native Android modules attempting to register audio services crashed due to missing Java classes.

#### Root Cause 3: Redundant Native Bridge Dependencies
- Unused dependencies (`expo-web-browser`, `expo-secure-store`) introduced unnecessary native Android bridge overhead for functionality that could be handled with core React Native APIs.

---

### 2.5 Permanent Solutions Implemented

1. **Fixed `expo-clipboard` in `package.json`**:
   Pinned `expo-clipboard` to `~8.0.8` (the exact release verified for Expo SDK 54).
2. **Pruned Unused Native Modules**:
   Removed `expo-audio`, `expo-video`, `expo-notifications`, `expo-keep-awake`, `expo-secure-store`, and `expo-web-browser` from `package.json`.
3. **Replaced Native Bridge Calls with Built-In Modules**:
   - `components/external-link.tsx`: Switched from `expo-web-browser` to standard `Linking.openURL()` from `react-native`.
   - `lib/_core/auth.ts`: Switched from `expo-secure-store` to `@react-native-async-storage/async-storage`.
4. **Verified TypeScript & Configuration**:
   Executed `npx tsc --noEmit` — **0 errors**. Cleaned and locked dependency graph in `pnpm-lock.yaml`.

---

## Part 3: Summary of Decisions & Lessons Learned

| Decision / Hypothesis | Outcome | Analysis & Lessons Learned |
| :--- | :--- | :--- |
| **Babel & NativeWind CSS variable prefixing** | Partially Valid | Necessary for Tailwind styling, but did not resolve the core theme switching bug because the scheme hook itself was returning the wrong string. |
| **Stack `contentStyle` injection** | Valid | Prevented white/dark flashes during screen transitions in nested routers. |
| **Fixing `use-color-scheme.web.ts`** | **Critical Success** | Highlighted the importance of checking Expo platform-specific files (`*.web.ts`, `*.ios.ts`, `*.android.ts`) when behavior diverges across platforms. |
| **Disabling `reactCompiler`** | Valid | React 19 Compiler is currently experimental in Expo SDK 54 and should not be used in production standalone builds alongside Reanimated 4 / NativeWind. |
| **Safe Area Inset Defensive Defaults** | Valid | Protects Android against cold-boot null pointer exceptions before window insets are calculated by the Android OS. |
| **Initial Phase 1 Rebuild without `expo-doctor`** | Incomplete | Overlooked native dependency version mismatches (`expo-clipboard 57.0.1`). Using automated diagnostic tooling (`expo-doctor`) directly identified native ABI incompatibilities. |
| **Replacing `expo-secure-store` & `expo-web-browser`** | Valid & Lean | Minimized native footprint by leveraging existing standard packages (`Linking`, `AsyncStorage`) rather than bundling unneeded native libraries. |

---

## Part 4: File Modification Reference

| File | Changes Made |
| :--- | :--- |
| **[hooks/use-color-scheme.web.ts](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/hooks/use-color-scheme.web.ts)** | Switched from `react-native-web`'s `useColorScheme` to `useThemeContext().colorScheme`. |
| **[lib/theme-provider.tsx](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/lib/theme-provider.tsx)** | Added `--color-*` NativeWind tokens, `Appearance.addChangeListener`, and web `document.body` synchronization. |
| **[package.json](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/package.json)** | Aligned `expo-clipboard` to `~8.0.8`; pruned unused audio, video, browser, and notification native packages. |
| **[app.config.ts](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/app.config.ts)** | Removed `experiments.reactCompiler` and unused native plugins; added EAS Project ID. |
| **[app/_layout.tsx](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/app/_layout.tsx)** | Hardened `initialWindowMetrics` against undefined cold-boot insets. |
| **[components/external-link.tsx](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/components/external-link.tsx)** | Replaced `expo-web-browser` with native `Linking.openURL()`. |
| **[lib/_core/auth.ts](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/lib/_core/auth.ts)** | Replaced `expo-secure-store` with `AsyncStorage`. |
| **[constants/oauth.ts](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/constants/oauth.ts)** | Provided safe default fallback API URL for native runtime. |
| **[eas.json](file:///c:/Users/sithu/MyWorks/My%20Softwares/Mobile_Apps/my_life_manager/eas.json)** | Configured `preview` profile with `buildType: "apk"` for standalone installation. |
