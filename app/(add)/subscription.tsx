import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { subscriptions as subStorage } from "@/lib/storage";
import type { Subscription } from "@/lib/types";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const BILLING_OPTIONS: { key: Subscription["billingCycle"]; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "one-time", label: "One-time" },
];

const STATUS_OPTIONS: { key: Subscription["status"]; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "cancelled", label: "Cancelled" },
];

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", category: "", cost: "", currency: "USD",
    billingCycle: "monthly" as Subscription["billingCycle"],
    renewalDate: "", url: "", status: "active" as Subscription["status"], notes: "",
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await subStorage.add({
      name: form.name, category: form.category, cost: parseFloat(form.cost) || 0,
      currency: form.currency, billingCycle: form.billingCycle,
      renewalDate: form.renewalDate, url: form.url, status: form.status, notes: form.notes,
    });
    router.back();
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Add Subscription</Text>
        </View>
        <Pressable onPress={handleSave} style={({ pressed }) => ({ padding: 8, borderRadius: 10, backgroundColor: "#5B8DEF", opacity: pressed ? 0.8 : 1 })}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E8EAED", marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Name</Text>
          <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g., Netflix, Spotify" style={inputStyle} placeholderTextColor="#8B8FA3" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Category</Text>
          <TextInput value={form.category} onChangeText={(v) => setForm({ ...form, category: v })}
            placeholder="e.g., Entertainment" style={inputStyle} placeholderTextColor="#8B8FA3" />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Cost</Text>
              <TextInput value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })}
                placeholder="0.00" keyboardType="decimal-pad" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
            <View style={{ width: 80 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Currency</Text>
              <TextInput value={form.currency} onChangeText={(v) => setForm({ ...form, currency: v })}
                placeholder="USD" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
          </View>

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Billing Cycle</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {BILLING_OPTIONS.map((opt) => (
              <Pressable key={opt.key} onPress={() => setForm({ ...form, billingCycle: opt.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.billingCycle === opt.key ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.billingCycle === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Renewal Date</Text>
          <TextInput value={form.renewalDate} onChangeText={(v) => setForm({ ...form, renewalDate: v })}
            placeholder="YYYY-MM-DD" style={inputStyle} placeholderTextColor="#8B8FA3" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Status</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable key={opt.key} onPress={() => setForm({ ...form, status: opt.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.status === opt.key ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.status === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>URL (optional)</Text>
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
