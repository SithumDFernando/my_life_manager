import { useState, useCallback } from "react";
import { useFocusEffect , useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { venues as venuesStorage } from "@/lib/storage";
import type { Venue } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ScreenHeader } from "@/components/ui/screen-header";
import { LocationLinkButton } from "@/components/ui/location-link-button";
import { showAlert } from "@/lib/alert";

export default function VenuesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [venList, setVenList] = useState<Venue[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", mapUrl: "", notes: "" });

  const loadVenues = useCallback(async () => {
    const data = await venuesStorage.getAll();
    setVenList(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useFocusEffect(
    useCallback(() => { loadVenues(); }, [loadVenues])
  );

  const resetForm = () => {
    setForm({ name: "", address: "", city: "", mapUrl: "", notes: "" });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) {
      showAlert("Missing Name", "Please enter a venue name before saving.");
      return;
    }
    await venuesStorage.add(form);
    resetForm();
    setShowAdd(false);
    loadVenues();
  };

  const handleUpdate = async () => {
    if (!editingVenue) return;
    if (!form.name.trim()) {
      showAlert("Missing Name", "Please enter a venue name before saving.");
      return;
    }
    await venuesStorage.update(editingVenue.id, form);
    setEditingVenue(null);
    resetForm();
    loadVenues();
  };

  const handleDelete = (id: string, name: string) => {
    showAlert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await venuesStorage.delete(id); loadVenues(); } },
    ]);
  };

  const openEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setForm({ name: venue.name, address: venue.address || "", city: venue.city || "", mapUrl: venue.mapUrl || "", notes: venue.notes || "" });
  };

  return (
    <ScreenContainer className="px-5">
      <ScreenHeader title="Venues" showBack actionIcon="plus" onActionPress={() => { resetForm(); setShowAdd(true); }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {venList.length === 0 ? (
          <EmptyState title="No venues saved" icon="map.pin" />
        ) : (
          venList.map((venue) => (
            <Pressable
              key={venue.id}
              onPress={() => openEdit(venue)}
              style={({ pressed }) => ({
                backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 0.5, borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{venue.name}</Text>
                  {venue.city ? <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>{venue.city}</Text> : null}
                  {venue.address ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{venue.address}</Text> : null}
                  {venue.mapUrl ? (
                    <View style={{ marginTop: 8 }}>
                      <LocationLinkButton mapUrl={venue.mapUrl} address="View on Maps" />
                    </View>
                  ) : null}
                </View>
                <Pressable onPress={() => handleDelete(venue.id, venue.name)} style={{ padding: 4 }}>
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <BottomSheetModal visible={showAdd || !!editingVenue} onClose={() => { setShowAdd(false); setEditingVenue(null); resetForm(); }} title={editingVenue ? "Edit Venue" : "Add Venue"} scrollable maxHeight="85%">
        <FormField label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="e.g., Central Park, Starbucks" />
        <FormField label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder="Full address" />
        <FormField label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} placeholder="City" />
        <FormField label="Map URL (optional)" value={form.mapUrl} onChangeText={(v) => setForm({ ...form, mapUrl: v })} placeholder="Google Maps link" />
        <FormField label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Additional notes" multiline />

        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <Pressable onPress={() => { setShowAdd(false); setEditingVenue(null); resetForm(); }}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={editingVenue ? handleUpdate : handleAdd} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>{editingVenue ? "Update" : "Save"}</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </ScreenContainer>
  );
}
