import { useState } from "react";
import { ScrollView, Text, View, Pressable , Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { FormField } from "@/components/ui/form-field";
import { subscriptions as subStorage } from "@/lib/storage";
import type { Subscription } from "@/lib/types";
import { CURRENCIES, SUBSCRIPTION_CATEGORIES } from "@/lib/constants";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

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
  const colors = useColors();
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
      <ScreenHeader title="Add Subscription" showBack onActionPress={handleSave} actionLabel="Save" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
          <FormField label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g., Netflix, Spotify" />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 4 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 6 }}>
            {SUBSCRIPTION_CATEGORIES.map((cat) => (
              <Pressable key={cat} onPress={() => setForm({ ...form, category: cat })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.category === cat ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.category === cat ? "#FFF" : colors.muted }}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <FormField label="" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} placeholder="Or type custom category" />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Cost" value={form.cost} onChangeText={(v) => setForm({ ...form, cost: v })} placeholder="0.00" keyboardType="decimal-pad" />
            </View>
          </View>

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 4 }}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
            {CURRENCIES.map((cur) => (
              <Pressable key={cur.code} onPress={() => setForm({ ...form, currency: cur.code })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.currency === cur.code ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.currency === cur.code ? "#FFF" : colors.muted }}>{cur.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Billing Cycle</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {BILLING_OPTIONS.map((opt) => (
              <Pressable key={opt.key} onPress={() => setForm({ ...form, billingCycle: opt.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.billingCycle === opt.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.billingCycle === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <FormField label="Renewal Date" value={form.renewalDate} onChangeText={(v) => setForm({ ...form, renewalDate: v })} placeholder="YYYY-MM-DD" />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 4 }}>Status</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable key={opt.key} onPress={() => setForm({ ...form, status: opt.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.status === opt.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.status === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <FormField label="URL (optional)" value={form.url} onChangeText={(v) => setForm({ ...form, url: v })} placeholder="https://..." autoCapitalize="none" keyboardType="url" />
          <FormField label="Notes (optional)" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Additional notes" multiline />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
