import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function AddLayout() {
  const colors = useColors();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="account" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="reading" />
      <Stack.Screen name="achievement" />
    </Stack>
  );
}
