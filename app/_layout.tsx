import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider , useThemeContext } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

import { useColors } from "@/hooks/use-colors";


const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigation({ trpcClient, queryClient }: { trpcClient: any; queryClient: any }) {
  const colors = useColors();
  const { colorScheme } = useThemeContext();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(pin-lock)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(add)" />
            <Stack.Screen name="(more)" />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const initialInsets = useMemo(() => {
    const raw = initialWindowMetrics?.insets;
    if (!raw) return DEFAULT_WEB_INSETS;
    return {
      top: raw.top ?? 0,
      right: raw.right ?? 0,
      bottom: raw.bottom ?? 0,
      left: raw.left ?? 0,
    };
  }, []);

  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    if (metrics?.insets) {
      setInsets(metrics.insets);
    }
    if (metrics?.frame) {
      setFrame(metrics.frame);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const rawInsets = initialWindowMetrics?.insets ?? insets ?? DEFAULT_WEB_INSETS;
    const rawFrame = initialWindowMetrics?.frame ?? frame ?? DEFAULT_WEB_FRAME;
    return {
      frame: rawFrame,
      insets: {
        top: Math.max(rawInsets?.top ?? 0, 16),
        bottom: Math.max(rawInsets?.bottom ?? 0, 12),
        left: rawInsets?.left ?? 0,
        right: rawInsets?.right ?? 0,
      },
    };
  }, [insets, frame]);

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              <RootNavigation trpcClient={trpcClient} queryClient={queryClient} />
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <RootNavigation trpcClient={trpcClient} queryClient={queryClient} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
