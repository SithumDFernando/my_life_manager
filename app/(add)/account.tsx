import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { accounts as accountsStorage } from "@/lib/storage";
import type { AccountCategory } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const CATEGORIES: { key: AccountCategory; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "google", label: "Google" },
  { key: "social", label: "Social" },
  { key: "website", label: "Website" },
  { key: "financial", label: "Financial" },
  { key: "other", label: "Other" },
];

export default function AddAccountScreen() {
  const router = useRouter();
  const colors = useColors();
  const [form, setForm] = useState({
    name: "", category: "website" as AccountCategory, username: "", password: "", url: "", notes: "",
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await accountsStorage.add(form);
    router.back();
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>Add Account</Text>
        </View>
        <Pressable onPress={handleSave} style={({ pressed }) => ({ padding: 8, borderRadius: 10, backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 })}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Account Name</Text>
          <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g., Gmail, Twitter" style={getInputStyle(colors)} placeholderTextColor={colors.muted} />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.key} onPress={() => setForm({ ...form, category: cat.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.category === cat.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.category === cat.key ? "#FFF" : colors.muted }}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Username / Email</Text>
          <TextInput value={form.username} onChangeText={(v) => setForm({ ...form, username: v })}
            placeholder="username or email" style={getInputStyle(colors)} placeholderTextColor={colors.muted} autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Password</Text>
          <TextInput value={form.password} onChangeText={(v) => setForm({ ...form, password: v })}
            placeholder="password" style={getInputStyle(colors)} placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>URL (optional)</Text>
          <TextInput value={form.url} onChangeText={(v) => setForm({ ...form, url: v })}
            placeholder="https://..." style={getInputStyle(colors)} placeholderTextColor={colors.muted} autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Notes (optional)</Text>
          <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Additional notes" style={{ ...getInputStyle(colors), minHeight: 80, textAlignVertical: "top" }} placeholderTextColor={colors.muted} multiline />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function getInputStyle(colors: any) {
  return {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.foreground,
  };
}
