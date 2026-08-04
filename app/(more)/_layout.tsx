import { Stack } from "expo-router";

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bio" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="competitions" />
      <Stack.Screen name="events" />
      <Stack.Screen name="venues" />
      <Stack.Screen name="backup" />
    </Stack>
  );
}
