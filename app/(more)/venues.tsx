import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { venues as venuesStorage } from "@/lib/storage";
import type { Venue } from "@/lib/types";

export default function VenuesScreen() {
  const router = useRouter();
  const [venList, setVenList] = useState<Venue[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", notes: "" });

  useEffect(() => { loadVenues(); }, []);

  const loadVenues = async () => {
    const data = await venuesStorage.getAll();
    setVenList(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await venuesStorage.add(form);
    setForm({ name: "", address: "", city: "", notes: "" });
    setShowAdd(false);
    loadVenues();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await venuesStorage.delete(id); loadVenues(); } },
    ]);
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Venues</Text>
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
        {venList.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="map.pin" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No venues saved</Text>
          </View>
        ) : (
          venList.map((venue) => (
            <View key={venue.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{venue.name}</Text>
                  {venue.city ? <Text style={{ fontSize: 12, color: "#5B8DEF", marginTop: 4 }}>{venue.city}</Text> : null}
                  {venue.address ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 4 }}>{venue.address}</Text> : null}
                </View>
                <Pressable onPress={() => handleDelete(venue.id, venue.name)} style={{ padding: 4 }}>
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
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 }}>Add Venue</Text>
            <TextInput placeholder="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
            <TextInput placeholder="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
            <TextInput placeholder="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => { setShowAdd(false); setForm({ name: "", address: "", city: "", notes: "" }); }}
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
