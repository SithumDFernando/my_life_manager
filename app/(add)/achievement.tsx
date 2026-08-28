import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput , Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { achievements as achStorage } from "@/lib/storage";
import { DatePickerField } from "@/components/ui/date-picker-field";
import type { Achievement } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";
import * as Haptics from "expo-haptics";


const TYPE_OPTIONS: { key: Achievement["type"]; label: string }[] = [
  { key: "hackathon", label: "Hackathon" },
  { key: "competition", label: "Competition" },
  { key: "certification", label: "Certification" },
  { key: "award", label: "Award" },
  { key: "milestone", label: "Milestone" },
  { key: "other", label: "Other" },
];

export default function AddAchievementScreen() {
  const router = useRouter();
  const colors = useColors();
  const [form, setForm] = useState({
    title: "", type: "hackathon" as Achievement["type"],
    date: "", place: "", prize: "", competitionId: "", description: "",
  });

  const handleSave = async () => {
    if (!form.title.trim()) {
      showAlert("Missing Title", "Please enter an achievement title before saving.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await achStorage.add(form);
    router.back();
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>Add Achievement</Text>
        </View>
        <Pressable onPress={handleSave} style={({ pressed }) => ({ padding: 8, borderRadius: 10, backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 })}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
            {TYPE_OPTIONS.map((opt) => (
              <Pressable key={opt.key} onPress={() => setForm({ ...form, type: opt.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.type === opt.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.type === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Title</Text>
          <TextInput value={form.title} onChangeText={(v) => setForm({ ...form, title: v })}
            placeholder="e.g., 1st Place - TechHack 2024" style={getInputStyle(colors)} placeholderTextColor={colors.muted} />

          <DatePickerField label="Date" value={form.date} onDateChange={(d) => setForm({ ...form, date: d })} />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Place / Position</Text>
          <TextInput value={form.place} onChangeText={(v) => setForm({ ...form, place: v })}
            placeholder="e.g., 1st Place, Top 10" style={getInputStyle(colors)} placeholderTextColor={colors.muted} />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Prize (optional)</Text>
          <TextInput value={form.prize} onChangeText={(v) => setForm({ ...form, prize: v })}
            placeholder="e.g., $5000, Certificate" style={getInputStyle(colors)} placeholderTextColor={colors.muted} />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Related Competition (optional)</Text>
          <TextInput value={form.competitionId} onChangeText={(v) => setForm({ ...form, competitionId: v })}
            placeholder="Competition name or ID" style={getInputStyle(colors)} placeholderTextColor={colors.muted} />

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, marginTop: 12 }}>Description</Text>
          <TextInput value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="Details about the achievement..."
            style={{ ...getInputStyle(colors), minHeight: 100, textAlignVertical: "top" }} placeholderTextColor={colors.muted} multiline />
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
