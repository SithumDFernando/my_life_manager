import React, { useState, useCallback, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Platform, KeyboardAvoidingView } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { SuggestionField } from "@/components/ui/suggestion-field";
import { CategoryPillSelector } from "@/components/ui/category-pill-selector";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";
import { habits, targets, habitStats } from "@/lib/habit-storage";
import type { Habit, MasterTarget, HabitStats, GamificationProfile, HabitFrequencyType, HabitType, TargetDateType } from "@/lib/types";
import { HABIT_FREQUENCIES, HABIT_TYPES, DEFAULT_HABIT_CATEGORIES, DEFAULT_MASTER_TARGETS } from "@/lib/constants";
import { HabitAnalyticsModal } from "@/components/habits/habit-analytics-modal";

const COMMON_EMOJIS = ["💪", "💧", "📖", "🏃", "🧘", "🥗", "💊", "💤", "💻", "🧠", "🚫", "🚬", "📱", "🎮", "💰", "✏️", "🧹", "🪴", "🚀", "🔥"];

export default function ImproveScreen() {
  const colors = useColors();
  
  // Data
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const [targetList, setTargetList] = useState<MasterTarget[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, HabitStats>>({});
  const [profile, setProfile] = useState<GamificationProfile>({ totalXP: 0, level: 1, levelTitle: "Initiate" });
  
  // Modals & Forms
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MasterTarget | null>(null);
  
  // Analytics Modal
  const [analyticsHabit, setAnalyticsHabit] = useState<Habit | null>(null);

  // Suggestions
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>(DEFAULT_HABIT_CATEGORIES);
  const [targetSuggestions, setTargetSuggestions] = useState<string[]>(DEFAULT_MASTER_TARGETS);

  const loadData = useCallback(async () => {
    await habitStats.recalculateAll();
    const [allHabits, allTargets, prof] = await Promise.all([
      habits.getAll(),
      targets.getAll(),
      habitStats.getProfile(),
    ]);
    
    setHabitList(allHabits);
    setTargetList(allTargets);
    setProfile(prof);

    const sMap: Record<string, HabitStats> = {};
    for (const h of allHabits) {
      sMap[h.id] = await habitStats.getForHabit(h.id);
    }
    setStatsMap(sMap);

    // Extract dynamic suggestions
    const uniqueCats = new Set([...DEFAULT_HABIT_CATEGORIES, ...allHabits.map(h => h.category), ...allTargets.map(t => t.category || "")]);
    uniqueCats.delete("");
    setCategorySuggestions(Array.from(uniqueCats));

    const uniqueTargets = new Set([...DEFAULT_MASTER_TARGETS, ...allTargets.map(t => t.title)]);
    setTargetSuggestions(Array.from(uniqueTargets));
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  // === TARGET FORM STATE ===
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDateType, setTDateType] = useState<TargetDateType>("none");
  const [tStartDate, setTStartDate] = useState("");
  const [tEndDate, setTEndDate] = useState("");

  const openAddTarget = () => {
    setEditingTarget(null);
    setTTitle("");
    setTDesc("");
    setTCategory("");
    setTDateType("none");
    setTStartDate("");
    setTEndDate("");
    setShowTargetModal(true);
  };

  const openEditTarget = (target: MasterTarget) => {
    setEditingTarget(target);
    setTTitle(target.title);
    setTDesc(target.description || "");
    setTCategory(target.category || "");
    setTDateType(target.dateType);
    setTStartDate(target.startDate || "");
    setTEndDate(target.endDate || "");
    setShowTargetModal(true);
  };

  const handleSaveTarget = async () => {
    if (!tTitle.trim()) {
      showAlert("Validation", "Target title is required.");
      return;
    }
    const data = {
      title: tTitle.trim(),
      description: tDesc.trim(),
      category: tCategory.trim(),
      dateType: tDateType,
      startDate: tDateType === "range" ? tStartDate : undefined,
      endDate: tDateType !== "none" ? tEndDate : undefined,
      status: "active" as const,
    };

    if (editingTarget) {
      await targets.update(editingTarget.id, data);
    } else {
      await targets.add(data);
    }
    
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowTargetModal(false);
    loadData();
  };

  const handleDeleteTarget = () => {
    if (!editingTarget) return;
    showAlert("Delete Target", "Do you want to delete just the target (habits keep their logs) or cascade delete everything?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Just Target",
        onPress: async () => {
          await targets.delete(editingTarget.id, false);
          setShowTargetModal(false);
          loadData();
        }
      },
      {
        text: "Cascade Delete All",
        style: "destructive",
        onPress: async () => {
          await targets.delete(editingTarget.id, true);
          setShowTargetModal(false);
          loadData();
        }
      }
    ]);
  };

  // === HABIT FORM STATE ===
  const [hName, setHName] = useState("");
  const [hEmoji, setHEmoji] = useState("💪");
  const [hCategory, setHCategory] = useState("");
  const [hTargetId, setHTargetId] = useState(""); // empty string = no target
  const [hType, setHType] = useState<HabitType>("positive");
  const [hFreq, setHFreq] = useState<HabitFrequencyType>("daily");
  const [hWeeklyTarget, setHWeeklyTarget] = useState("3");
  const [hNumericTarget, setHNumericTarget] = useState("1000");
  const [hNumericUnit, setHNumericUnit] = useState("ml");

  const openAddHabit = (targetId?: string) => {
    setEditingHabit(null);
    setHName("");
    setHEmoji("💪");
    setHCategory("");
    setHTargetId(targetId || "");
    setHType("positive");
    setHFreq("daily");
    setHWeeklyTarget("3");
    setHNumericTarget("1000");
    setHNumericUnit("ml");
    setShowHabitModal(true);
  };

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHName(habit.name);
    setHEmoji(habit.emoji || "💪");
    setHCategory(habit.category);
    setHTargetId(habit.targetId || "");
    setHType(habit.habitType);
    setHFreq(habit.frequency.type);
    setHWeeklyTarget(habit.frequency.weeklyTarget?.toString() || "3");
    setHNumericTarget(habit.numericTarget?.toString() || "1000");
    setHNumericUnit(habit.numericUnit || "ml");
    setShowHabitModal(true);
  };

  const handleSaveHabit = async () => {
    if (!hName.trim() || !hCategory.trim()) {
      showAlert("Validation", "Name and Category are required.");
      return;
    }

    if (hType === "numeric") {
      const numT = parseInt(hNumericTarget);
      if (isNaN(numT) || numT <= 0) {
        showAlert("Validation", "Please enter a valid numeric target greater than 0.");
        return;
      }
    }

    if (hFreq === "weekly") {
      const wt = parseInt(hWeeklyTarget);
      if (isNaN(wt) || wt <= 0) {
        showAlert("Validation", "Please enter a valid weekly frequency target greater than 0.");
        return;
      }
    }

    const data = {
      name: hName.trim(),
      emoji: hEmoji,
      category: hCategory.trim(),
      targetId: hTargetId || undefined,
      habitType: hType,
      frequency: { type: hFreq, weeklyTarget: hFreq === "weekly" ? parseInt(hWeeklyTarget) : undefined },
      numericTarget: hType === "numeric" ? parseInt(hNumericTarget) : undefined,
      numericUnit: hType === "numeric" ? hNumericUnit : undefined,
    };

    if (editingHabit) {
      await habits.update(editingHabit.id, data);
    } else {
      await habits.add(data);
    }
    
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowHabitModal(false);
    loadData();
  };

  const handleDeleteHabit = () => {
    if (!editingHabit) return;
    showAlert("Archive Habit", "This will hide the habit from the active board but keep historical logs and XP. Proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: async () => {
          await habits.archive(editingHabit.id);
          setShowHabitModal(false);
          loadData();
      }},
    ]);
  };

  const progressPercent = Math.min(100, Math.round((profile.totalXP / 100000) * 100)); // Simulating progress to titan

  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Gamification Banner */}
        <View style={{ paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>Improve</Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>Strategy & Analysis Hub</Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 14, color: colors.muted }}>Level {profile.level}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#F59E0B" }}>{profile.levelTitle}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{profile.totalXP} XP</Text>
            </View>
          </View>
          
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${progressPercent}%`, backgroundColor: "#F59E0B", borderRadius: 4 }} />
          </View>
        </View>

        {/* Master Targets Section */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>Master Targets</Text>
          <Pressable onPress={openAddTarget}>
            <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {targetList.length === 0 ? (
          <EmptyState icon="target" title="No Targets" subtitle="Define high-level goals first" />
        ) : (
          targetList.map((target) => (
            <View key={target.id} style={{ marginBottom: 16, backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              <Pressable onPress={() => openEditTarget(target)} style={{ padding: 16, backgroundColor: colors.surface }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{target.title}</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
                {target.dateType !== "none" && (
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>
                    {target.dateType === "deadline" ? `Deadline: ${target.endDate}` : `${target.startDate} to ${target.endDate}`}
                  </Text>
                )}
              </Pressable>

              {/* Linked Habits */}
              <View style={{ padding: 12, paddingTop: 4 }}>
                {habitList.filter(h => h.targetId === target.id).map((h) => (
                  <Pressable 
                    key={h.id} 
                    onPress={() => setAnalyticsHabit(h)}
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>{h.emoji}</Text>
                      <Text style={{ fontSize: 15, color: colors.foreground }}>{h.name}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Pressable onPress={() => setAnalyticsHabit(h)}>
                        <IconSymbol name="chart.bar.fill" size={18} color={colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => openEditHabit(h)}>
                        <IconSymbol name="pencil" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
                <Pressable onPress={() => openAddHabit(target.id)} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 4, marginTop: 4 }}>
                  <IconSymbol name="plus" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "500" }}>Add Linked Habit</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* Unlinked Habits */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>Other Habits</Text>
          <Pressable onPress={() => openAddHabit()}>
            <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {habitList.filter(h => !h.targetId).map((h) => (
          <View key={h.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 24 }}>{h.emoji}</Text>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{h.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{h.category}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Pressable onPress={() => setAnalyticsHabit(h)}>
                <IconSymbol name="chart.bar.fill" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => openEditHabit(h)}>
                <IconSymbol name="pencil" size={20} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* TARGET MODAL */}
      <BottomSheetModal visible={showTargetModal} onClose={() => setShowTargetModal(false)} title={editingTarget ? "Edit Master Target" : "New Master Target"} scrollable>
        <FormField label="Target Title" value={tTitle} onChangeText={setTTitle} placeholder="e.g. Master AI Engineering" required />
        <SuggestionField label="Category" value={tCategory} onChangeText={setTCategory} suggestions={categorySuggestions} placeholder="e.g. Career, Health" />
        
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Timeline Type</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {(["none", "deadline", "range"] as const).map(type => (
            <Pressable key={type} onPress={() => setTDateType(type)} style={{ flex: 1, paddingVertical: 10, backgroundColor: tDateType === type ? colors.primary : colors.background, borderRadius: 8, borderWidth: 1, borderColor: tDateType === type ? colors.primary : colors.border, alignItems: "center" }}>
              <Text style={{ color: tDateType === type ? "#FFF" : colors.foreground, fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{type}</Text>
            </Pressable>
          ))}
        </View>

        {tDateType !== "none" && (
          <>
            {tDateType === "range" && <DatePickerField label="Start Date" value={tStartDate} onChange={setTStartDate} placeholder="YYYY-MM-DD" />}
            <DatePickerField label="End Date / Deadline" value={tEndDate} onChange={setTEndDate} placeholder="YYYY-MM-DD" />
          </>
        )}

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          {editingTarget && (
            <Pressable onPress={handleDeleteTarget} style={{ flex: 1, backgroundColor: colors.error + "20", padding: 14, borderRadius: 12, alignItems: "center" }}>
              <Text style={{ color: colors.error, fontSize: 16, fontWeight: "600" }}>Delete</Text>
            </Pressable>
          )}
          <Pressable onPress={handleSaveTarget} style={{ flex: 2, backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>Save Target</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      {/* HABIT MODAL */}
      <BottomSheetModal visible={showHabitModal} onClose={() => setShowHabitModal(false)} title={editingHabit ? "Edit Habit" : "New Habit"} scrollable>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormField label="Emoji" value={hEmoji} onChangeText={setHEmoji} />
          </View>
          <View style={{ flex: 3 }}>
            <FormField label="Habit Name" value={hName} onChangeText={setHName} placeholder="e.g. Read 20 pages" required />
          </View>
        </View>

        <SuggestionField label="Category" value={hCategory} onChangeText={setHCategory} suggestions={categorySuggestions} required />
        
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Link to Master Target</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: "hidden" }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 8, gap: 8 }}>
            <Pressable onPress={() => setHTargetId("")} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: hTargetId === "" ? colors.primary : colors.background, borderWidth: 1, borderColor: hTargetId === "" ? colors.primary : colors.border }}>
              <Text style={{ color: hTargetId === "" ? "#FFF" : colors.muted, fontSize: 13, fontWeight: "500" }}>None</Text>
            </Pressable>
            {targetList.map(t => (
              <Pressable key={t.id} onPress={() => setHTargetId(t.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: hTargetId === t.id ? colors.primary : colors.background, borderWidth: 1, borderColor: hTargetId === t.id ? colors.primary : colors.border }}>
                <Text style={{ color: hTargetId === t.id ? "#FFF" : colors.foreground, fontSize: 13, fontWeight: "500" }}>{t.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Habit Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {HABIT_TYPES.map((type) => (
            <Pressable key={type.key} onPress={() => setHType(type.key)} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: hType === type.key ? colors.primary : colors.surface, borderRadius: 10, borderWidth: 1, borderColor: hType === type.key ? colors.primary : colors.border }}>
              <Text style={{ color: hType === type.key ? "#FFFFFF" : colors.foreground, fontSize: 14, fontWeight: "600" }}>{type.label}</Text>
            </Pressable>
          ))}
        </View>

        {hType === "numeric" && (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Target (e.g. 1000)" value={hNumericTarget} onChangeText={setHNumericTarget} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Unit (e.g. ml)" value={hNumericUnit} onChangeText={setHNumericUnit} />
            </View>
          </View>
        )}

        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Frequency</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {HABIT_FREQUENCIES.map((freq) => (
            <Pressable key={freq.key} onPress={() => setHFreq(freq.key)} style={{ flex: 1, paddingVertical: 10, backgroundColor: hFreq === freq.key ? colors.primary : colors.surface, borderRadius: 10, borderWidth: 1, borderColor: hFreq === freq.key ? colors.primary : colors.border, alignItems: "center" }}>
              <Text style={{ color: hFreq === freq.key ? "#FFFFFF" : colors.foreground, fontSize: 14, fontWeight: "600" }}>{freq.label}</Text>
            </Pressable>
          ))}
        </View>

        {hFreq === "weekly" && (
          <FormField label="Times per week" value={hWeeklyTarget} onChangeText={setHWeeklyTarget} keyboardType="numeric" />
        )}

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          {editingHabit && (
            <Pressable onPress={handleDeleteHabit} style={{ flex: 1, backgroundColor: colors.error + "20", padding: 14, borderRadius: 12, alignItems: "center" }}>
              <Text style={{ color: colors.error, fontSize: 16, fontWeight: "600" }}>Archive</Text>
            </Pressable>
          )}
          <Pressable onPress={handleSaveHabit} style={{ flex: 2, backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>Save Habit</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      {/* ANALYTICS MODAL */}
      <HabitAnalyticsModal 
        visible={!!analyticsHabit} 
        onClose={() => setAnalyticsHabit(null)} 
        habit={analyticsHabit} 
        stats={analyticsHabit ? statsMap[analyticsHabit.id] : null} 
      />

    </ScreenContainer>
  );
}
