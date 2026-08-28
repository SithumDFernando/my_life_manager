import { useState } from "react";
import { ScrollView, Text, View, Pressable , Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { FormField } from "@/components/ui/form-field";
import { accounts as accountsStorage } from "@/lib/storage";
import type { AccountCategory } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";


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
      <ScreenHeader title="Add Account" showBack onActionPress={handleSave} actionLabel="Save" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
          <FormField label="Account Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g., Gmail, Twitter" />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 4 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.key} onPress={() => setForm({ ...form, category: cat.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.category === cat.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.category === cat.key ? "#FFF" : colors.muted }}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <FormField label="Username / Email" value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} placeholder="username or email" autoCapitalize="none" />
          <FormField label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} placeholder="password" secureTextEntry autoCapitalize="none" />
          <FormField label="URL (optional)" value={form.url} onChangeText={(v) => setForm({ ...form, url: v })} placeholder="https://..." autoCapitalize="none" keyboardType="url" />
          <FormField label="Notes (optional)" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Additional notes" multiline />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
