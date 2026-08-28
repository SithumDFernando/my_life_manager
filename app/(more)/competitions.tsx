import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useFocusEffect , useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { competitions as compStorage } from "@/lib/storage";
import type { Competition } from "@/lib/types";
import { COMPETITION_RESULTS, CURRENCIES } from "@/lib/constants";
import { useColors } from "@/hooks/use-colors";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ScreenHeader } from "@/components/ui/screen-header";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { showAlert } from "@/lib/alert";

const STATUS_OPTIONS: { key: Competition["status"]; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
];

const TEAM_OPTIONS: { key: "team" | "individual"; label: string }[] = [
  { key: "individual", label: "Individual" },
  { key: "team", label: "Team" },
];

export default function CompetitionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [comps, setComps] = useState<Competition[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [form, setForm] = useState({
    name: "", category: "", status: "upcoming" as Competition["status"],
    startDate: "", endDate: "", result: "", organizer: "",
    teamOrIndividual: "individual" as "team" | "individual",
    prizeAmount: "", prizeCurrency: "USD", notes: "",
  });

  const loadComps = useCallback(async () => {
    const data = await compStorage.getAll();
    setComps(data.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "")));
  }, []);

  useFocusEffect(
    useCallback(() => { loadComps(); }, [loadComps])
  );

  const resetForm = () => {
    setForm({
      name: "", category: "", status: "upcoming", startDate: "", endDate: "",
      result: "", organizer: "", teamOrIndividual: "individual",
      prizeAmount: "", prizeCurrency: "USD", notes: "",
    });
  };

  const validate = () => {
    if (!form.name.trim()) {
      showAlert("Missing Name", "Please enter a competition name before saving.");
      return false;
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      showAlert("Invalid Date Range", "Start date cannot be after end date.");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    await compStorage.add({
      ...form,
      prizeAmount: form.prizeAmount ? parseFloat(form.prizeAmount) : undefined,
    });
    resetForm();
    setShowAdd(false);
    loadComps();
  };

  const handleEdit = async () => {
    if (!editingComp || !validate()) return;
    await compStorage.update(editingComp.id, {
      ...form,
      prizeAmount: form.prizeAmount ? parseFloat(form.prizeAmount) : undefined,
    });
    setEditingComp(null);
    resetForm();
    loadComps();
  };

  const handleDelete = (id: string, name: string) => {
    showAlert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await compStorage.delete(id); loadComps(); } },
    ]);
  };

  const openEdit = (comp: Competition) => {
    setEditingComp(comp);
    setForm({
      name: comp.name, category: comp.category, status: comp.status,
      startDate: comp.startDate || "", endDate: comp.endDate || "",
      result: comp.result || "", organizer: comp.organizer || "",
      teamOrIndividual: comp.teamOrIndividual || "individual",
      prizeAmount: comp.prizeAmount ? String(comp.prizeAmount) : "",
      prizeCurrency: comp.prizeCurrency || "USD", notes: comp.notes || "",
    });
  };

  const statusColor = (status: string) => {
    if (status === "completed") return colors.success;
    if (status === "ongoing") return colors.warning;
    return colors.primary;
  };

  return (
    <ScreenContainer className="px-5">
      <ScreenHeader title="Competitions" showBack actionIcon="plus" onActionPress={() => { resetForm(); setShowAdd(true); }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {comps.length === 0 ? (
          <EmptyState title="No competitions yet" icon="trophy.fill" />
        ) : (
          comps.map((comp) => (
            <View key={comp.id} style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{comp.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{comp.category}</Text>
                  {comp.organizer ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Organized by: {comp.organizer}</Text> : null}
                  {comp.teamOrIndividual ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                      <IconSymbol name={comp.teamOrIndividual === "team" ? "person.2.fill" : "person.fill"} size={12} color={colors.primary} />
                      <Text style={{ fontSize: 11, color: colors.primary, textTransform: "capitalize" }}>{comp.teamOrIndividual}</Text>
                    </View>
                  ) : null}
                  {comp.startDate ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{comp.startDate}{comp.endDate ? ` — ${comp.endDate}` : ""}</Text> : null}
                  {comp.result ? <Text style={{ fontSize: 12, color: colors.success, marginTop: 4 }}>Result: {comp.result}</Text> : null}
                  {comp.prizeAmount ? (
                    <Text style={{ fontSize: 12, color: colors.success, marginTop: 2 }}>
                      Prize: {CURRENCIES.find(c => c.code === comp.prizeCurrency)?.symbol || ""}{comp.prizeAmount}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <View style={{ padding: 4, borderRadius: 6, backgroundColor: statusColor(comp.status) + "20" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: statusColor(comp.status), textTransform: "capitalize" }}>{comp.status}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Pressable onPress={() => openEdit(comp)} style={{ padding: 4 }}>
                      <IconSymbol name="pencil" size={16} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(comp.id, comp.name)} style={{ padding: 4 }}>
                      <IconSymbol name="trash" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <BottomSheetModal visible={showAdd || !!editingComp} onClose={() => { setShowAdd(false); setEditingComp(null); resetForm(); }} title={editingComp ? "Edit Competition" : "Add Competition"} scrollable maxHeight="85%">
        <CompetitionForm form={form} setForm={setForm} onSave={editingComp ? handleEdit : handleAdd} onCancel={() => { setShowAdd(false); setEditingComp(null); resetForm(); }} colors={colors} />
      </BottomSheetModal>
    </ScreenContainer>
  );
}

function CompetitionForm({ form, setForm, onSave, onCancel, colors }: {
  form: any; setForm: (f: any) => void; onSave: () => void; onCancel: () => void; colors: any;
}) {
  return (
    <View>
      <FormField label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Name" />
      <FormField label="Category" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} placeholder="Category" />
      <FormField label="Organizer" value={form.organizer} onChangeText={(v) => setForm({ ...form, organizer: v })} placeholder="Organizer" />

      {/* Team / Individual */}
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8, marginTop: 4 }}>Team / Individual</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {TEAM_OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={() => setForm({ ...form, teamOrIndividual: opt.key })}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
              backgroundColor: form.teamOrIndividual === opt.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: form.teamOrIndividual === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <DatePickerField mode="date" label="Start Date" value={form.startDate} onDateChange={(d) => setForm({ ...form, startDate: d })} />
      <DatePickerField mode="date" label="End Date (optional)" value={form.endDate} onDateChange={(d) => setForm({ ...form, endDate: d })} />

      {/* Result dropdown */}
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8, marginTop: 4 }}>Result</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
        {COMPETITION_RESULTS.map((result) => (
          <Pressable key={result} onPress={() => setForm({ ...form, result })}
            style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
              backgroundColor: form.result === result ? colors.success : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: form.result === result ? "#FFF" : colors.muted }}>{result}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Prize */}
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Prize</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
        <View style={{ flex: 1 }}>
          <FormField label="" value={form.prizeAmount} onChangeText={(v) => setForm({ ...form, prizeAmount: v })} placeholder="Amount" keyboardType="decimal-pad" />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
        {CURRENCIES.map((cur) => (
          <Pressable key={cur.code} onPress={() => setForm({ ...form, prizeCurrency: cur.code })}
            style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: form.prizeCurrency === cur.code ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: form.prizeCurrency === cur.code ? "#FFF" : colors.muted }}>{cur.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Status */}
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Status</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {STATUS_OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={() => setForm({ ...form, status: opt.key })}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
              backgroundColor: form.status === opt.key ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: form.status === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <FormField label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Additional notes..." multiline />

      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <Pressable onPress={onCancel}
          style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onSave} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
