import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function MoreLayout() {
  const colors = useColors();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="bio" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="competitions" />
      <Stack.Screen name="events" />
      <Stack.Screen name="venues" />
      <Stack.Screen name="backup" />
    </Stack>
  );
}
