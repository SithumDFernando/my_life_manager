import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { competitions as compStorage } from "@/lib/storage";
import type { Competition } from "@/lib/types";

const STATUS_OPTIONS: { key: Competition["status"]; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
];

export default function CompetitionsScreen() {
  const router = useRouter();
  const [comps, setComps] = useState<Competition[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [form, setForm] = useState({
    name: "", category: "", status: "upcoming" as Competition["status"],
    startDate: "", endDate: "", result: "", notes: "",
  });

  const loadComps = useCallback(async () => {
    const data = await compStorage.getAll();
    setComps(data.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "")));
  }, []);

  useFocusEffect(
    useCallback(() => { loadComps(); }, [loadComps])
  );

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await compStorage.add(form);
    setForm({ name: "", category: "", status: "upcoming", startDate: "", endDate: "", result: "", notes: "" });
    setShowAdd(false);
    loadComps();
  };

  const handleEdit = async () => {
    if (!editingComp || !form.name.trim()) return;
    await compStorage.update(editingComp.id, form);
    setEditingComp(null);
    setForm({ name: "", category: "", status: "upcoming", startDate: "", endDate: "", result: "", notes: "" });
    loadComps();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await compStorage.delete(id); loadComps(); } },
    ]);
  };

  const openEdit = (comp: Competition) => {
    setEditingComp(comp);
    setForm({
      name: comp.name, category: comp.category, status: comp.status,
      startDate: comp.startDate || "", endDate: comp.endDate || "",
      result: comp.result || "", notes: comp.notes || "",
    });
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "#34D399";
    if (status === "ongoing") return "#FBBF24";
    return "#5B8DEF";
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Competitions</Text>
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
        {comps.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="trophy.fill" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No competitions yet</Text>
          </View>
        ) : (
          comps.map((comp) => (
            <View key={comp.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{comp.name}</Text>
                  <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>{comp.category}</Text>
                  {comp.startDate ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 4 }}>{comp.startDate}{comp.endDate ? ` — ${comp.endDate}` : ""}</Text> : null}
                  {comp.result ? <Text style={{ fontSize: 12, color: "#34D399", marginTop: 4 }}>Result: {comp.result}</Text> : null}
                </View>
                <View style={{ flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <View style={{ padding: 4, borderRadius: 6, backgroundColor: statusColor(comp.status) + "20" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: statusColor(comp.status), textTransform: "capitalize" }}>{comp.status}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Pressable onPress={() => openEdit(comp)} style={{ padding: 4 }}>
                      <IconSymbol name="pencil" size={16} color="#5B8DEF" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(comp.id, comp.name)} style={{ padding: 4 }}>
                      <IconSymbol name="trash" size={16} color="#F87171" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 }}>Add Competition</Text>
            <ModalForm form={form} setForm={setForm} onSave={handleAdd} onCancel={() => { setShowAdd(false); setForm({ name: "", category: "", status: "upcoming", startDate: "", endDate: "", result: "", notes: "" }); }} />
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingComp} animationType="slide" transparent onRequestClose={() => setEditingComp(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 }}>Edit Competition</Text>
            <ModalForm form={form} setForm={setForm} onSave={handleEdit} onCancel={() => setEditingComp(null)} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function ModalForm({ form, setForm, onSave, onCancel }: {
  form: any; setForm: (f: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <View>
      <TextInput placeholder="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
        style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
      <TextInput placeholder="Category" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })}
        style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
      <TextInput placeholder="Start Date (YYYY-MM-DD)" value={form.startDate} onChangeText={(v) => setForm({ ...form, startDate: v })}
        style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
      <TextInput placeholder="End Date (YYYY-MM-DD)" value={form.endDate} onChangeText={(v) => setForm({ ...form, endDate: v })}
        style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
      <TextInput placeholder="Result" value={form.result} onChangeText={(v) => setForm({ ...form, result: v })}
        style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />

      <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 8 }}>Status</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {STATUS_OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={() => setForm({ ...form, status: opt.key })}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
              backgroundColor: form.status === opt.key ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: form.status === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable onPress={onCancel}
          style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B8FA3" }}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onSave} style={{ flex: 1, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
