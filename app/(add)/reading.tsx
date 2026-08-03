import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { readingItems as readingStorage } from "@/lib/storage";
import type { ReadingItem } from "@/lib/types";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const TYPE_OPTIONS: { key: ReadingItem["type"]; label: string }[] = [
  { key: "book", label: "Book" },
  { key: "research_paper", label: "Research Paper" },
  { key: "article", label: "Article" },
];

const STATUS_OPTIONS: { key: ReadingItem["status"]; label: string }[] = [
  { key: "not_started", label: "Not Started" },
  { key: "reading", label: "Reading" },
  { key: "completed", label: "Completed" },
];

export default function AddReadingScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "book" as ReadingItem["type"], title: "", author: "",
    status: "not_started" as ReadingItem["status"],
    startDate: "", endDate: "", rating: "", notes: "", pages: "", pagesRead: "", url: "",
  });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await readingStorage.add({
      type: form.type, title: form.title, author: form.author,
      status: form.status, startDate: form.startDate, endDate: form.endDate,
      rating: form.rating ? parseInt(form.rating) : undefined,
      notes: form.notes, pages: form.pages ? parseInt(form.pages) : undefined,
      pagesRead: form.pagesRead ? parseInt(form.pagesRead) : undefined,
      url: form.url,
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
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Add Reading</Text>
        </View>
        <Pressable onPress={handleSave} style={({ pressed }) => ({ padding: 8, borderRadius: 10, backgroundColor: "#5B8DEF", opacity: pressed ? 0.8 : 1 })}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E8EAED", marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Type</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
            {TYPE_OPTIONS.map((opt) => (
              <Pressable key={opt.key} onPress={() => setForm({ ...form, type: opt.key })}
                style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: form.type === opt.key ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: form.type === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Title</Text>
          <TextInput value={form.title} onChangeText={(v) => setForm({ ...form, title: v })}
            placeholder="Title" style={inputStyle} placeholderTextColor="#8B8FA3" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Author</Text>
          <TextInput value={form.author} onChangeText={(v) => setForm({ ...form, author: v })}
            placeholder="Author name" style={inputStyle} placeholderTextColor="#8B8FA3" />

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

          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Start Date</Text>
              <TextInput value={form.startDate} onChangeText={(v) => setForm({ ...form, startDate: v })}
                placeholder="YYYY-MM-DD" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>End Date</Text>
              <TextInput value={form.endDate} onChangeText={(v) => setForm({ ...form, endDate: v })}
                placeholder="YYYY-MM-DD" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Total Pages</Text>
              <TextInput value={form.pages} onChangeText={(v) => setForm({ ...form, pages: v })}
                placeholder="0" keyboardType="number-pad" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Pages Read</Text>
              <TextInput value={form.pagesRead} onChangeText={(v) => setForm({ ...form, pagesRead: v })}
                placeholder="0" keyboardType="number-pad" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6 }}>Rating (1-5)</Text>
              <TextInput value={form.rating} onChangeText={(v) => setForm({ ...form, rating: v })}
                placeholder="0" keyboardType="number-pad" style={inputStyle} placeholderTextColor="#8B8FA3" />
            </View>
          </View>

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>URL (optional)</Text>
          <TextInput value={form.url} onChangeText={(v) => setForm({ ...form, url: v })}
            placeholder="https://..." style={inputStyle} placeholderTextColor="#8B8FA3" autoCapitalize="none" />

          <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 6, marginTop: 12 }}>Notes</Text>
          <TextInput value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })}
            placeholder="Your thoughts..." style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" }} placeholderTextColor="#8B8FA3" multiline />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const inputStyle = {
  backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  fontSize: 14, color: "#1A1A2E",
};
