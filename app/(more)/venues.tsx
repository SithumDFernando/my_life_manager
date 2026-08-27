import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { venues as venuesStorage } from "@/lib/storage";
import type { Venue } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";

export default function VenuesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [venList, setVenList] = useState<Venue[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", notes: "" });

  const loadVenues = useCallback(async () => {
    const data = await venuesStorage.getAll();
    setVenList(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  useFocusEffect(
    useCallback(() => { loadVenues(); }, [loadVenues])
  );

  const resetForm = () => {
    setForm({ name: "", address: "", city: "", notes: "" });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await venuesStorage.add(form);
    resetForm();
    setShowAdd(false);
    loadVenues();
  };

  const handleUpdate = async () => {
    if (!editingVenue || !form.name.trim()) return;
    await venuesStorage.update(editingVenue.id, form);
    setEditingVenue(null);
    resetForm();
    loadVenues();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await venuesStorage.delete(id); loadVenues(); } },
    ]);
  };

  const openEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setForm({ name: venue.name, address: venue.address || "", city: venue.city || "", notes: venue.notes || "" });
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>Venues</Text>
        </View>
        <Pressable
          onPress={() => { resetForm(); setShowAdd(true); }}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {venList.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="map.pin" size={48} color={colors.border} />
            <Text style={{ fontSize: 15, color: colors.muted, marginTop: 12 }}>No venues saved</Text>
          </View>
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
      <Modal visible={showAdd || !!editingVenue} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
              {editingVenue ? "Edit Venue" : "Add Venue"}
            </Text>
            <TextInput placeholder="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
              style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.foreground, marginBottom: 10 }} placeholderTextColor={colors.muted} />
            <TextInput placeholder="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })}
              style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.foreground, marginBottom: 10 }} placeholderTextColor={colors.muted} />
            <TextInput placeholder="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })}
              style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.foreground, marginBottom: 10 }} placeholderTextColor={colors.muted} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => { setShowAdd(false); setEditingVenue(null); resetForm(); }}
                style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={editingVenue ? handleUpdate : handleAdd} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>{editingVenue ? "Update" : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
