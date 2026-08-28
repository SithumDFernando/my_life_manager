import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(
    (Appearance.getColorScheme?.() as ColorScheme) ?? "light"
  );
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const subscription = Appearance.addChangeListener?.(({ colorScheme: newScheme }) => {
      if (newScheme === "light" || newScheme === "dark") {
        setSystemScheme(newScheme);
      }
    });

    AsyncStorage.getItem("@mylife_theme").then((savedMode) => {
      if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
        setModeState(savedMode as ThemeMode);
      }
      setIsLoaded(true);
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  const colorScheme = mode === "system" ? systemScheme : mode;

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
      if (document.body) {
        document.body.style.backgroundColor = palette.background;
        document.body.style.color = palette.foreground;
      }
    }
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem("@mylife_theme", newMode);
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setMode(scheme);
  }, [setMode]);

  useEffect(() => {
    if (isLoaded) {
      applyScheme(colorScheme);
    }
  }, [applyScheme, colorScheme, isLoaded]);

  const themeVariables = useMemo(
    () =>
      vars({
        "--color-primary": SchemeColors[colorScheme].primary,
        "--color-background": SchemeColors[colorScheme].background,
        "--color-surface": SchemeColors[colorScheme].surface,
        "--color-foreground": SchemeColors[colorScheme].foreground,
        "--color-muted": SchemeColors[colorScheme].muted,
        "--color-border": SchemeColors[colorScheme].border,
        "--color-success": SchemeColors[colorScheme].success,
        "--color-warning": SchemeColors[colorScheme].warning,
        "--color-error": SchemeColors[colorScheme].error,
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      mode,
      setMode,
      setColorScheme,
    }),
    [colorScheme, mode, setMode, setColorScheme],
  );

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1, backgroundColor: SchemeColors[colorScheme].background }, themeVariables]}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
