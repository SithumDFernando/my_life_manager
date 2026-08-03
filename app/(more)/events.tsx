import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { events as eventsStorage } from "@/lib/storage";
import type { Event } from "@/lib/types";

const TYPE_OPTIONS: { key: Event["type"]; label: string }[] = [
  { key: "meeting", label: "Meeting" },
  { key: "deadline", label: "Deadline" },
  { key: "conference", label: "Conference" },
  { key: "hackathon", label: "Hackathon" },
  { key: "personal", label: "Personal" },
  { key: "other", label: "Other" },
];

export default function EventsScreen() {
  const router = useRouter();
  const [evts, setEvts] = useState<Event[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", date: "", venueId: "", type: "meeting" as Event["type"], notes: "",
  });

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const data = await eventsStorage.getAll();
    setEvts(data.sort((a, b) => b.date.localeCompare(a.date)));
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.date.trim()) return;
    await eventsStorage.add(form);
    setForm({ title: "", description: "", date: "", venueId: "", type: "meeting", notes: "" });
    setShowAdd(false);
    loadEvents();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await eventsStorage.delete(id); loadEvents(); } },
    ]);
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Events</Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18, backgroundColor: "#5B8DEF",
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {evts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="calendar" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No events yet</Text>
          </View>
        ) : (
          evts.map((evt) => (
            <View key={evt.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{evt.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: "#5B8DEF" }}>{evt.date}</Text>
                    <View style={{ padding: 3, borderRadius: 6, backgroundColor: "#5B8DEF15" }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#5B8DEF", textTransform: "capitalize" }}>{evt.type}</Text>
                    </View>
                  </View>
                  {evt.description ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 6, lineHeight: 16 }}>{evt.description}</Text> : null}
                </View>
                <Pressable onPress={() => handleDelete(evt.id, evt.title)} style={{ padding: 4 }}>
                  <IconSymbol name="trash" size={18} color="#F87171" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}><View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} /></View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 }}>Add Event</Text>
            <TextInput placeholder="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
            <TextInput placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
            <TextInput placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
            <TextInput placeholder="Venue (optional)" value={form.venueId} onChangeText={(v) => setForm({ ...form, venueId: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />

            <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 8 }}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
              {TYPE_OPTIONS.map((opt) => (
                <Pressable key={opt.key} onPress={() => setForm({ ...form, type: opt.key })}
                  style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: form.type === opt.key ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.type === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => { setShowAdd(false); setForm({ title: "", description: "", date: "", venueId: "", type: "meeting", notes: "" }); }}
                style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B8FA3" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAdd} style={{ flex: 1, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
