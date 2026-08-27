import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { bioData as bioDataStorage } from "@/lib/storage";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function BioScreen() {
  const router = useRouter();
  const colors = useColors();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "", dateOfBirth: "", phone: "", email: "", address: "",
    education: "", university: "", degree: "",
    linkedin: "", github: "", hackerrank: "", portfolio: "", twitter: "",
    otherLinks: "", notes: "",
  });

  const loadBio = useCallback(async () => {
    const data = await bioDataStorage.get();
    if (data) {
      setForm({
        fullName: data.fullName || "",
        dateOfBirth: data.dateOfBirth || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        education: data.education || "",
        university: data.university || "",
        degree: data.degree || "",
        linkedin: data.linkedin || "",
        github: data.github || "",
        hackerrank: data.hackerrank || "",
        portfolio: data.portfolio || "",
        twitter: data.twitter || "",
        otherLinks: data.otherLinks || "",
        notes: data.notes || "",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadBio(); }, [loadBio])
  );

  const handleSave = async () => {
    if (!form.fullName.trim()) return;
    setSaving(true);
    await bioDataStorage.save(form);
    setSaving(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved!", "Bio data updated successfully.", [{ text: "OK" }]);
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>Bio Data</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ gap: 16, marginBottom: 20 }}>
          <Section title="Personal Info" colors={colors}>
            <InputField label="Full Name" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} colors={colors} />
            <InputField label="Date of Birth" value={form.dateOfBirth} onChangeText={(v) => setForm({ ...form, dateOfBirth: v })} placeholder="YYYY-MM-DD" colors={colors} />
            <InputField label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} colors={colors} />
            <InputField label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} colors={colors} />
            <InputField label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} colors={colors} />
          </Section>

          <Section title="Education" colors={colors}>
            <InputField label="Education Level" value={form.education} onChangeText={(v) => setForm({ ...form, education: v })} placeholder="e.g., B.Tech, M.Tech" colors={colors} />
            <InputField label="University" value={form.university} onChangeText={(v) => setForm({ ...form, university: v })} colors={colors} />
            <InputField label="Degree" value={form.degree} onChangeText={(v) => setForm({ ...form, degree: v })} colors={colors} />
          </Section>

          <Section title="Social & Professional" colors={colors}>
            <InputField label="LinkedIn" value={form.linkedin} onChangeText={(v) => setForm({ ...form, linkedin: v })} placeholder="URL" colors={colors} />
            <InputField label="GitHub" value={form.github} onChangeText={(v) => setForm({ ...form, github: v })} placeholder="URL" colors={colors} />
            <InputField label="HackerRank" value={form.hackerrank} onChangeText={(v) => setForm({ ...form, hackerrank: v })} placeholder="URL" colors={colors} />
            <InputField label="Portfolio" value={form.portfolio} onChangeText={(v) => setForm({ ...form, portfolio: v })} placeholder="URL" colors={colors} />
            <InputField label="Twitter/X" value={form.twitter} onChangeText={(v) => setForm({ ...form, twitter: v })} placeholder="URL" colors={colors} />
            <InputField label="Other Links" value={form.otherLinks} onChangeText={(v) => setForm({ ...form, otherLinks: v })} colors={colors} />
          </Section>

          <Section title="Notes" colors={colors}>
            <InputField label="Additional Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline colors={colors} />
          </Section>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center",
            opacity: pressed || saving ? 0.7 : 1, marginBottom: 40,
          })}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
            {saving ? "Saving..." : "Save Bio Data"}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 14 }}>{title}</Text>
      {children}
    </View>
  );
}

function InputField({ label, value, onChangeText, placeholder, multiline, colors }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; colors: any;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.border}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={{
          backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
          fontSize: 14, color: colors.foreground, textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? 100 : 42,
        }}
      />
    </View>
  );
}
