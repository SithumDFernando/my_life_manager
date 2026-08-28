import { useState, useCallback } from "react";
import { useFocusEffect , useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { events as eventsStorage } from "@/lib/storage";
import type { Event } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ScreenHeader } from "@/components/ui/screen-header";

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
  const colors = useColors();
  const [evts, setEvts] = useState<Event[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", date: "", venueId: "", type: "meeting" as Event["type"], notes: "",
  });

  const loadEvents = useCallback(async () => {
    const data = await eventsStorage.getAll();
    setEvts(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => { loadEvents(); }, [loadEvents])
  );

  const resetForm = () => {
    setForm({ title: "", description: "", date: "", venueId: "", type: "meeting", notes: "" });
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.date.trim()) return;
    await eventsStorage.add(form);
    resetForm();
    setShowAdd(false);
    loadEvents();
  };

  const handleUpdate = async () => {
    if (!editingEvent || !form.title.trim()) return;
    await eventsStorage.update(editingEvent.id, form);
    setEditingEvent(null);
    resetForm();
    loadEvents();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await eventsStorage.delete(id); loadEvents(); } },
    ]);
  };

  const openEdit = (evt: Event) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title, description: evt.description || "", date: evt.date,
      venueId: evt.venueId || "", type: evt.type, notes: evt.notes || "",
    });
  };

  return (
    <ScreenContainer className="px-5">
      <ScreenHeader title="Events" showBack actionIcon="plus" onActionPress={() => { resetForm(); setShowAdd(true); }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {evts.length === 0 ? (
          <EmptyState title="No events yet" icon="calendar" />
        ) : (
          evts.map((evt) => (
            <Pressable
              key={evt.id}
              onPress={() => openEdit(evt)}
              style={({ pressed }) => ({
                backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 0.5, borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{evt.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.primary }}>{evt.date}</Text>
                    <View style={{ padding: 3, borderRadius: 6, backgroundColor: colors.primary + "15" }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: "capitalize" }}>{evt.type}</Text>
                    </View>
                  </View>
                  {evt.description ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 }}>{evt.description}</Text> : null}
                </View>
                <Pressable onPress={() => handleDelete(evt.id, evt.title)} style={{ padding: 4 }}>
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <BottomSheetModal visible={showAdd || !!editingEvent} onClose={() => { setShowAdd(false); setEditingEvent(null); resetForm(); }} title={editingEvent ? "Edit Event" : "Add Event"} scrollable maxHeight="85%">
        <FormField label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Event title" />
        <FormField label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="YYYY-MM-DD" />
        <FormField label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Description" multiline />
        <FormField label="Venue (optional)" value={form.venueId} onChangeText={(v) => setForm({ ...form, venueId: v })} placeholder="Venue" />

        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
          {TYPE_OPTIONS.map((opt) => (
            <Pressable key={opt.key} onPress={() => setForm({ ...form, type: opt.key })}
              style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                backgroundColor: form.type === opt.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: form.type === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => { setShowAdd(false); setEditingEvent(null); resetForm(); }}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={editingEvent ? handleUpdate : handleAdd} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>{editingEvent ? "Update" : "Save"}</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </ScreenContainer>
  );
}
