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
import { DatePickerField } from "@/components/ui/date-picker-field";
import { LocationLinkButton } from "@/components/ui/location-link-button";
import { showAlert } from "@/lib/alert";

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
    title: "", description: "", date: "", isAllDay: true, startTime: "", endTime: "", venueId: "", mapUrl: "", type: "meeting" as Event["type"], notes: "",
  });

  const loadEvents = useCallback(async () => {
    const data = await eventsStorage.getAll();
    setEvts(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => { loadEvents(); }, [loadEvents])
  );

  const resetForm = () => {
    setForm({ title: "", description: "", date: "", isAllDay: true, startTime: "", endTime: "", venueId: "", mapUrl: "", type: "meeting", notes: "" });
  };

  const validate = () => {
    if (!form.title.trim()) {
      showAlert("Missing Title", "Please enter an event title before saving.");
      return false;
    }
    if (!form.date.trim()) {
      showAlert("Missing Date", "Please select a date for the event.");
      return false;
    }
    if (!form.isAllDay && form.startTime && form.endTime && form.startTime > form.endTime) {
      showAlert("Invalid Time Range", "Start time cannot be after end time.");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    await eventsStorage.add(form);
    resetForm();
    setShowAdd(false);
    loadEvents();
  };

  const handleUpdate = async () => {
    if (!editingEvent || !validate()) return;
    await eventsStorage.update(editingEvent.id, form);
    setEditingEvent(null);
    resetForm();
    loadEvents();
  };

  const handleDelete = (id: string, title: string) => {
    showAlert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await eventsStorage.delete(id); loadEvents(); } },
    ]);
  };

  const openEdit = (evt: Event) => {
    setEditingEvent(evt);
    setForm({
      title: evt.title, description: evt.description || "", date: evt.date,
      isAllDay: evt.isAllDay ?? (evt.startTime ? false : true),
      startTime: evt.startTime || "", endTime: evt.endTime || "",
      venueId: evt.venueId || "", mapUrl: evt.mapUrl || "", type: evt.type, notes: evt.notes || "",
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500" }}>
                      {evt.date}
                      {!evt.isAllDay && evt.startTime ? ` • ${evt.startTime}${evt.endTime ? ` - ${evt.endTime}` : ""}` : " • All day"}
                    </Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.primary + "15" }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: "capitalize" }}>{evt.type}</Text>
                    </View>
                  </View>
                  {evt.description ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 }}>{evt.description}</Text> : null}
                  {evt.mapUrl ? (
                    <View style={{ marginTop: 8 }}>
                      <LocationLinkButton mapUrl={evt.mapUrl} address="View on Maps" />
                    </View>
                  ) : null}
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
        <DatePickerField mode="date" label="Date" value={form.date} onDateChange={(d) => setForm({ ...form, date: d })} />

        {/* All-Day Toggle */}
        <Pressable
          onPress={() => setForm({ ...form, isAllDay: !form.isAllDay })}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, marginBottom: 12 }}
        >
          <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "500" }}>All-day Event</Text>
          <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.isAllDay ? colors.primary : colors.surface, padding: 2, borderWidth: 1, borderColor: colors.border, justifyContent: "center" }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFFFFF", alignSelf: form.isAllDay ? "flex-end" : "flex-start" }} />
          </View>
        </Pressable>

        {/* Time Fields (if not all day) */}
        {!form.isAllDay && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <DatePickerField mode="time" label="Start Time" value={form.startTime} onDateChange={(t) => setForm({ ...form, startTime: t })} placeholder="09:00" />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField mode="time" label="End Time" value={form.endTime} onDateChange={(t) => setForm({ ...form, endTime: t })} placeholder="17:00" />
            </View>
          </View>
        )}
        <FormField label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Description" multiline />
        <FormField label="Venue (optional)" value={form.venueId} onChangeText={(v) => setForm({ ...form, venueId: v })} placeholder="Venue" />
        <FormField label="Map URL (optional)" value={form.mapUrl} onChangeText={(v) => setForm({ ...form, mapUrl: v })} placeholder="Google Maps link" />

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
