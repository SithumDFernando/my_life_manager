import { Stack } from "expo-router";

export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="account" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="reading" />
      <Stack.Screen name="achievement" />
    </Stack>
  );
}
