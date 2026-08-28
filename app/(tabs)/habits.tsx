import React, { useState, useCallback, useMemo } from "react";
import { ScrollView, Text, View, Pressable, Platform, KeyboardAvoidingView } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { CategoryPillSelector } from "@/components/ui/category-pill-selector";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";
import { habits, habitLogs, habitStats, getLocalDateString } from "@/lib/habit-storage";
import type { Habit, HabitLog, HabitStats, GamificationProfile, HabitFrequencyType, HabitType } from "@/lib/types";
import { HABIT_FREQUENCIES, HABIT_TYPES, HABIT_XP, LEVEL_THRESHOLDS } from "@/lib/constants";

// Emojis for the picker
const COMMON_EMOJIS = ["💪", "💧", "📖", "🏃", "🧘", "🥗", "💊", "💤", "💻", "🧠", "🚫", "🚬", "📱", "🎮", "💰", "✏️", "🧹", "🪴", "🚀", "🔥"];

export default function HabitsScreen() {
  const colors = useColors();
  const [date, setDate] = useState<string>(getLocalDateString());
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, HabitStats>>({});
  const [profile, setProfile] = useState<GamificationProfile>({ totalXP: 0, level: 1, levelTitle: "Initiate" });
  
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const loadData = useCallback(async () => {
    // Check shields on load
    await habitStats.refillShields();
    await habitStats.recalculateAll();

    const [allHabits, dateLogs, prof] = await Promise.all([
      habits.getAll(),
      habitLogs.getAllForDate(date),
      habitStats.getProfile(),
    ]);

    const smap: Record<string, HabitStats> = {};
    for (const h of allHabits) {
      smap[h.id] = await habitStats.getForHabit(h.id);
    }
    
    setHabitList(allHabits);
    setLogs(dateLogs);
    setProfile(prof);
    setStatsMap(smap);
  }, [date]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const isToday = date === getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
  const isEditable = habitLogs.isEditable(date);

  // Categories extraction
  const categories = useMemo(() => {
    const cats = new Set(habitList.map((h) => h.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [habitList]);

  const filteredHabits = habitList.filter(h => selectedCategory === "all" || h.category === selectedCategory);

  // Interaction handlers
  const handleTogglePositive = async (habitId: string) => {
    if (!isEditable) return;
    const log = await habitLogs.toggleCompletion(habitId, date);
    if (log.completed) {
       if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       await processXP(HABIT_XP.DAILY_COMPLETION);
    } else {
       if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadData();
  };

  const handleLogSlip = async (habitId: string) => {
    if (!isEditable) return;
    showAlert("Log Slip", "Did you slip up today?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Slip", style: "destructive", onPress: async () => {
         await habitLogs.logSlip(habitId, date);
         if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
         await loadData();
      }}
    ]);
  };

  const handleAddNumeric = async (habitId: string, amount: number, target: number) => {
    if (!isEditable) return;
    const existingLog = logs.find(l => l.habitId === habitId);
    const currentVal = existingLog?.numericValue || 0;
    
    const log = await habitLogs.addNumericValue(habitId, date, amount);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if newly reached target
    if (currentVal < target && (currentVal + amount) >= target) {
      if (Platform.OS !== "web") setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
      await processXP(HABIT_XP.NUMERIC_TARGET_MET);
    }
    await loadData();
  };

  const processXP = async (amount: number) => {
    const res = await habitStats.awardXP(amount);
    if (res.leveledUp) {
      showAlert("🎉 Level Up!", `Congratulations! You are now Level ${res.newLevel}: ${res.newTitle}`);
    }
  };

  // Progress calculations for XP bar
  const nextLevelXP = LEVEL_THRESHOLDS.find(t => t.xp > profile.totalXP)?.xp || profile.totalXP;
  const currentLevelBaseXP = LEVEL_THRESHOLDS.find(t => t.level === profile.level)?.xp || 0;
  const xpProgress = nextLevelXP > currentLevelBaseXP ? (profile.totalXP - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP) : 1;

  return (
    <ScreenContainer className="px-5">
      <ScreenHeader title="Habits" actionIcon="plus" onActionPress={() => setShowAdd(true)} />
      
      {/* Date Navigator */}
      <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        <Pressable
          onPress={() => setDate(yesterday)}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: !isToday ? colors.primary : "transparent", alignItems: "center" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: !isToday ? "#FFF" : colors.muted }}>Yesterday</Text>
        </Pressable>
        <Pressable
          onPress={() => setDate(getLocalDateString())}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: isToday ? colors.primary : "transparent", alignItems: "center" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: isToday ? "#FFF" : colors.muted }}>Today</Text>
        </Pressable>
      </View>

      {/* Gamification Bar */}
      <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconSymbol name="bolt.fill" size={16} color="#F59E0B" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginLeft: 6 }}>Level {profile.level} — {profile.levelTitle}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>{profile.totalXP.toLocaleString()} XP</Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ width: `${Math.max(5, Math.min(100, xpProgress * 100))}%`, height: "100%", backgroundColor: "#F59E0B" }} />
        </View>
      </View>

      {/* Categories */}
      {categories.length > 2 && (
        <View style={{ marginBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map(cat => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: selectedCategory === cat ? "#FFF" : colors.muted, textTransform: "capitalize" }}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Habit List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredHabits.length === 0 ? (
           <EmptyState title="No habits yet" subtitle="Start building discipline!" icon="bolt.fill" />
        ) : (
          filteredHabits.map((habit) => {
            const log = logs.find(l => l.habitId === habit.id);
            const stats = statsMap[habit.id];
            
            return (
              <HabitCard 
                key={habit.id} 
                habit={habit} 
                log={log} 
                stats={stats} 
                colors={colors}
                isEditable={isEditable}
                onToggle={() => handleTogglePositive(habit.id)}
                onSlip={() => handleLogSlip(habit.id)}
                onAddNumeric={(amt) => handleAddNumeric(habit.id, amt, habit.numericTarget || 0)}
                onEdit={() => setEditingHabit(habit)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Modals */}
      {showAdd && <HabitFormModal colors={colors} onClose={() => setShowAdd(false)} onSaved={loadData} />}
      {editingHabit && <HabitFormModal habit={editingHabit} colors={colors} onClose={() => setEditingHabit(null)} onSaved={loadData} />}

    </ScreenContainer>
  );
}

// ---------------------------------------------------------
// HABIT CARD COMPONENT
// ---------------------------------------------------------
function HabitCard({ habit, log, stats, colors, isEditable, onToggle, onSlip, onAddNumeric, onEdit }: any) {
  const isPositive = habit.habitType === "positive";
  const isAvoidance = habit.habitType === "avoidance";
  const isNumeric = habit.habitType === "numeric";
  
  const completed = log?.completed || false;
  const numVal = log?.numericValue || 0;
  
  const isComplete = 
    (isPositive && completed) || 
    (isAvoidance && !completed && log) /* Wait, for avoidance, if no log it means safe. if completed=false it means slipped */ ||
    (isNumeric && numVal >= (habit.numericTarget || 1));
    
  const isSafe = isAvoidance && (!log || log.completed !== false);

  const cardBaseStyle = {
    backgroundColor: colors.background, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 0.5, borderColor: colors.border
  };

  return (
    <Pressable onLongPress={onEdit} style={({ pressed }) => ([cardBaseStyle, { opacity: pressed ? 0.9 : 1 }])}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
             <Text style={{ fontSize: 20 }}>{habit.emoji || "⚡"}</Text>
          </View>
          <View style={{ flex: 1 }}>
             <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{habit.name}</Text>
             <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 8, flexWrap: "wrap" }}>
               {habit.targetName && <Text style={{ fontSize: 11, color: colors.muted }}>{habit.targetName}</Text>}
               {habit.frequency.type === "weekly" && (
                 <View style={{ backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                   <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>{habit.frequency.weeklyTarget}x / week</Text>
                 </View>
               )}
               {stats && stats.currentStreak > 0 && (
                 <View style={{ flexDirection: "row", alignItems: "center" }}>
                   <IconSymbol name="flame.fill" size={12} color="#EF4444" />
                   <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600", marginLeft: 2 }}>{stats.currentStreak}</Text>
                 </View>
               )}
             </View>
          </View>
        </View>
        <Pressable onPress={onEdit} style={{ padding: 4 }}>
          <IconSymbol name="more_horiz" size={18} color={colors.muted} />
        </Pressable>
      </View>

      {/* POSITIVE / WEEKLY */}
      {isPositive && (
        <Pressable 
          onPress={onToggle}
          disabled={!isEditable}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: isComplete ? colors.success + "15" : colors.surface,
            padding: 12, borderRadius: 10, opacity: pressed || !isEditable ? 0.7 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconSymbol name={isComplete ? "checkmark.circle.fill" : "plus"} size={20} color={isComplete ? colors.success : colors.muted} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: isComplete ? colors.success : colors.foreground, marginLeft: 8 }}>
              {isComplete ? "Completed" : "Tap to complete"}
            </Text>
          </View>
          {!isComplete && <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>+25 XP</Text>}
        </Pressable>
      )}

      {/* AVOIDANCE */}
      {isAvoidance && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: isSafe ? colors.success + "15" : colors.error + "15", padding: 12, borderRadius: 10 }}>
           <View style={{ flexDirection: "row", alignItems: "center" }}>
             <IconSymbol name={isSafe ? "shield.fill" : "xmark.circle.fill"} size={20} color={isSafe ? colors.success : colors.error} />
             <Text style={{ fontSize: 14, fontWeight: "600", color: isSafe ? colors.success : colors.error, marginLeft: 8 }}>
               {isSafe ? "Shield Active (Safe)" : "Slipped"}
             </Text>
           </View>
           {isSafe && isEditable && (
             <Pressable onPress={onSlip} style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surface, borderRadius: 6 }}>
               <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted }}>Log Slip</Text>
             </Pressable>
           )}
        </View>
      )}

      {/* NUMERIC */}
      {isNumeric && (
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>Progress</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: isComplete ? colors.success : colors.foreground }}>
              {numVal} / {habit.numericTarget} {habit.numericUnit}
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
             <View style={{ width: `${Math.min(100, (numVal / (habit.numericTarget || 1)) * 100)}%`, height: "100%", backgroundColor: isComplete ? colors.success : colors.primary }} />
          </View>
          {isEditable && habit.numericQuickAdds && habit.numericQuickAdds.length > 0 && (
             <View style={{ flexDirection: "row", gap: 8 }}>
               {habit.numericQuickAdds.map((amt: number, i: number) => (
                 <Pressable
                   key={i}
                   onPress={() => onAddNumeric(amt)}
                   style={({ pressed }) => ({
                     flex: 1, paddingVertical: 8, backgroundColor: colors.surface, borderRadius: 8, alignItems: "center",
                     opacity: pressed ? 0.7 : 1
                   })}
                 >
                   <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>+{amt}</Text>
                 </Pressable>
               ))}
             </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------
// HABIT FORM MODAL
// ---------------------------------------------------------
function HabitFormModal({ habit, colors, onClose, onSaved }: any) {
  const isEditing = !!habit;
  const [form, setForm] = useState({
    name: habit?.name || "",
    category: habit?.category || "",
    habitType: habit?.habitType || "positive",
    frequencyType: habit?.frequency?.type || "daily",
    weeklyTarget: habit?.frequency?.weeklyTarget?.toString() || "3",
    numericTarget: habit?.numericTarget?.toString() || "",
    numericUnit: habit?.numericUnit || "",
    numericQuickAdds: habit?.numericQuickAdds?.join(", ") || "",
    targetName: habit?.targetName || "",
    emoji: habit?.emoji || "⚡",
  });
  const [errors, setErrors] = useState<any>({});

  const handleSave = async () => {
    let hasError = false;
    const newErrs: any = {};
    if (!form.name.trim()) { newErrs.name = "Habit name is required"; hasError = true; }
    
    if (hasError) {
      setErrors(newErrs);
      return;
    }
    
    const hData = {
      name: form.name.trim(),
      category: form.category.trim() || "Uncategorized",
      habitType: form.habitType as HabitType,
      frequency: {
        type: form.frequencyType as HabitFrequencyType,
        weeklyTarget: form.frequencyType === "weekly" ? parseInt(form.weeklyTarget) || 1 : undefined,
      },
      numericTarget: form.habitType === "numeric" ? parseFloat(form.numericTarget) || 0 : undefined,
      numericUnit: form.habitType === "numeric" ? form.numericUnit.trim() : undefined,
      numericQuickAdds: form.habitType === "numeric" && form.numericQuickAdds ? form.numericQuickAdds.split(",").map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n)) : undefined,
      targetName: form.targetName.trim() || undefined,
      emoji: form.emoji,
    };

    if (isEditing) {
      await habits.update(habit.id, hData);
    } else {
      await habits.add(hData as any);
    }
    
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };
  
  const handleDelete = () => {
    showAlert("Delete Habit", `Are you sure you want to delete "${habit.name}"? Logs and stats will be lost.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
         await habits.delete(habit.id);
         onSaved();
         onClose();
      }}
    ]);
  };

  return (
    <BottomSheetModal visible onClose={onClose} title={isEditing ? "Edit Habit" : "New Habit"} scrollable maxHeight="90%">
      <FormField label="Habit Name" value={form.name} onChangeText={(v) => { setForm({ ...form, name: v }); setErrors({ ...errors, name: undefined }); }} required error={errors.name} />
      
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Habit Type</Text>
      <View style={{ marginBottom: 16 }}>
        <CategoryPillSelector
           options={[...HABIT_TYPES]}
           selected={form.habitType}
           onSelect={(k) => setForm({ ...form, habitType: k as any })}
        />
      </View>

      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Frequency</Text>
      <View style={{ marginBottom: 16 }}>
        <CategoryPillSelector
           options={[...HABIT_FREQUENCIES]}
           selected={form.frequencyType}
           onSelect={(k) => setForm({ ...form, frequencyType: k as any })}
        />
      </View>

      {form.frequencyType === "weekly" && (
        <FormField label="Weekly Target (e.g. 3 times)" value={form.weeklyTarget} onChangeText={(v) => setForm({ ...form, weeklyTarget: v })} keyboardType="number-pad" />
      )}

      {form.habitType === "numeric" && (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormField label="Target Value" value={form.numericTarget} onChangeText={(v) => setForm({ ...form, numericTarget: v })} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <FormField label="Unit (e.g. ml)" value={form.numericUnit} onChangeText={(v) => setForm({ ...form, numericUnit: v })} />
          </View>
        </View>
      )}
      
      {form.habitType === "numeric" && (
        <FormField label="Quick Add Chips (comma separated)" placeholder="e.g. 250, 500" value={form.numericQuickAdds} onChangeText={(v) => setForm({ ...form, numericQuickAdds: v })} keyboardType="numbers-and-punctuation" />
      )}

      <FormField label="Category (e.g. Health, Career)" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
      <FormField label="Group / Master Target (Optional)" value={form.targetName} onChangeText={(v) => setForm({ ...form, targetName: v })} placeholder="e.g. Get Shredded" />

      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Emoji Icon</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {COMMON_EMOJIS.map(e => (
          <Pressable 
            key={e} 
            onPress={() => setForm({ ...form, emoji: e })}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: form.emoji === e ? colors.primary + "30" : colors.surface, alignItems: "center", justifyContent: "center", borderWidth: form.emoji === e ? 1 : 0, borderColor: colors.primary }}
          >
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>{isEditing ? "Save" : "Create Habit"}</Text>
        </Pressable>
      </View>

      {isEditing && (
        <Pressable onPress={handleDelete} style={{ marginTop: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error }}>Delete Habit</Text>
        </Pressable>
      )}
    </BottomSheetModal>
  );
}
