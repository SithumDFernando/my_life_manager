import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { accounts as accountsStorage } from "@/lib/storage";
import type { AccountCategory } from "@/lib/types";
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
            <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Add Account</Text>
        </View>
        <Pressable onPress={handleSave} style={({ pressed }) => ({ padding: 8, borderRadius: 10, backgroundColor: "#5B8DEF", opacity: pressed ? 0.8 : 1 })}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E8EAED", marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Account Name</Text>
          <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g., Gmail, Twitter" style={inputStyle} placeholderTextColor="#8B8FA3" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.key} onPress={() => setForm({ ...form, category: cat.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.category === cat.key ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.category === cat.key ? "#FFF" : "#8B8FA3" }}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Username / Email</Text>
          <TextInput value={form.username} onChangeText={(v) => setForm({ ...form, username: v })}
            placeholder="username or email" style={inputStyle} placeholderTextColor="#8B8FA3" autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Password</Text>
          <TextInput value={form.password} onChangeText={(v) => setForm({ ...form, password: v })}
            placeholder="password" style={inputStyle} placeholderTextColor="#8B8FA3" secureTextEntry autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>URL (optional)</Text>
          <TextInput value={form.url} onChangeText={(v) => setForm({ ...form, url: v })}
            placeholder="https://..." style={inputStyle} placeholderTextColor="#8B8FA3" autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Notes (optional)</Text>
          <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Additional notes" style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" }} placeholderTextColor="#8B8FA3" multiline />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const inputStyle = {
  backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  fontSize: 14, color: "#1A1A2E",
};
