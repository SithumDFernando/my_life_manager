import React, { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { tasks, dailyReports, settings as settingsStorage } from "@/lib/storage";
import { habits, habitLogs, getLocalDateString } from "@/lib/habit-storage";
import type { Task, DailyReport, Habit, HabitLog } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";
import * as Haptics from "expo-haptics";
import { HabitLogModal } from "@/components/habits/habit-log-modal";

export default function DailyScreen() {
  const colors = useColors();
  
  // Date State (Today or Yesterday)
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  
  // Tasks State
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [showReport, setShowReport] = useState<DailyReport | null>(null);
  const [newTask, setNewTask] = useState("");
  const [showCarryOver, setShowCarryOver] = useState(false);
  const [carryOverTasks, setCarryOverTasks] = useState<Task[]>([]);
  
  // Habits State
  const [habitList, setHabitList] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [activeLogHabit, setActiveLogHabit] = useState<Habit | null>(null);

  const [loading, setLoading] = useState(true);

  const todayStr = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  const isToday = selectedDate === todayStr;

  const loadData = useCallback(async (targetDate: string) => {
    // 1. Task lifecycle management (only on Today)
    if (targetDate === todayStr) {
      const currentSettings = await settingsStorage.get();
      if (currentSettings.lastOpenDate && currentSettings.lastOpenDate !== todayStr) {
        const yesterdayTasks = await tasks.getAll();
        const completed = yesterdayTasks.filter((t) => t.completed);
        const unfinished = yesterdayTasks.filter((t) => !t.completed);

        const report: DailyReport = {
          date: currentSettings.lastOpenDate,
          totalTasks: yesterdayTasks.length,
          completedTasks: completed.length,
          unfinishedTasks: unfinished,
        };

        await dailyReports.saveReport(report);
        await settingsStorage.save({ lastOpenDate: todayStr });
        await tasks.clearCompleted();
        
        if (unfinished.length > 0) {
          setCarryOverTasks(unfinished);
          setShowCarryOver(true);
        } else {
          setShowReport(report);
        }
      } else if (!currentSettings.lastOpenDate) {
        await settingsStorage.save({ lastOpenDate: todayStr });
      }
    }

    // 2. Load Tasks (we just show all active tasks in the list, though historically tasks are tied to "now", but we'll filter or show all)
    const allTasks = await tasks.getAll();
    setTodayTasks(allTasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));

    // 3. Load Habits & Logs for selected date
    const [allHabits, dateLogs] = await Promise.all([
      habits.getAll(),
      habitLogs.getAllForDate(targetDate),
    ]);
    
    setHabitList(allHabits);
    setLogs(dateLogs);
    setLoading(false);
  }, [todayStr]);

  useFocusEffect(
    useCallback(() => { loadData(selectedDate); }, [loadData, selectedDate])
  );

  // --- Task Handlers ---
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await tasks.add(newTask.trim());
    setNewTask("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData(selectedDate);
  };

  const handleToggleTask = async (id: string) => {
    await tasks.toggle(id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData(selectedDate);
  };

  const handleDeleteTask = (id: string) => {
    showAlert("Delete Task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await tasks.delete(id); loadData(selectedDate); } },
    ]);
  };

  const handleCarryOver = async (taskIds: string[]) => {
    await tasks.carryOver(taskIds);
    setShowCarryOver(false);
    setCarryOverTasks([]);
    loadData(selectedDate);
  };

  // --- Habit Handlers ---
  const handleQuickToggleHabit = async (habit: Habit) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const log = logs.find((l) => l.habitId === habit.id);
    if (habit.habitType === "avoidance") {
      // For avoidance, quick tap doesn't do much if it's safe. If they want to log slip, they use the modal.
      // Or we can let them open modal immediately.
      setActiveLogHabit(habit);
    } else if (habit.habitType === "positive") {
      // Toggle
      await habitLogs.toggleCompletion(habit.id, selectedDate);
      loadData(selectedDate);
    } else {
      // Numeric - open modal
      setActiveLogHabit(habit);
    }
  };

  // --- Calculations ---
  const displayDateStr = isToday 
    ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    : yesterdayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const completedTasksCount = todayTasks.filter((t) => t.completed).length;
  const totalTasksCount = todayTasks.length;
  
  // Calculate Habit completion
  let completedHabits = 0;
  let totalHabits = habitList.length;
  
  habitList.forEach(habit => {
    const log = logs.find(l => l.habitId === habit.id);
    if (habit.habitType === "positive") {
      if (log && log.completed) completedHabits++;
    } else if (habit.habitType === "avoidance") {
      if (!log || log.completed) completedHabits++; // Safe by default
    } else if (habit.habitType === "numeric") {
      if (log && habit.numericTarget && (log.numericValue || 0) >= habit.numericTarget) completedHabits++;
    }
  });

  const totalProgressItems = totalTasksCount + totalHabits;
  const completedProgressItems = completedTasksCount + completedHabits;
  const progressPercent = totalProgressItems > 0 ? Math.round((completedProgressItems / totalProgressItems) * 100) : 0;

  if (loading) {
    return (
      <ScreenContainer className="px-5">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 15, color: colors.muted }}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5">
      
      {/* Date Navigator (Grace Window) */}
      <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
        <Pressable 
          onPress={() => setSelectedDate(yesterdayStr)}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center", backgroundColor: !isToday ? colors.primary : "transparent", borderRadius: 8 }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: !isToday ? "#FFF" : colors.muted }}>Yesterday</Text>
        </Pressable>
        <Pressable 
          onPress={() => setSelectedDate(todayStr)}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center", backgroundColor: isToday ? colors.primary : "transparent", borderRadius: 8 }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: isToday ? "#FFF" : colors.muted }}>Today</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>{displayDateStr}</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>Daily Plan</Text>
        </View>

        {/* Combined Progress Card */}
        {(totalProgressItems > 0) && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 24, borderWidth: 0.5, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Execution Progress</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{completedProgressItems} of {totalProgressItems} done</Text>
              </View>
              <View style={{ backgroundColor: (progressPercent === 100 ? colors.success : colors.primary) + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: progressPercent === 100 ? colors.success : colors.primary }}>{progressPercent}%</Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${progressPercent}%`, backgroundColor: progressPercent === 100 ? colors.success : colors.primary, borderRadius: 4 }} />
            </View>
          </View>
        )}

        {/* SECTION: HABITS */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Habits</Text>
          
          {habitList.length === 0 ? (
            <EmptyState icon="bolt" title="No Habits" subtitle="Go to Improve to create habits" />
          ) : (
            habitList.map((habit) => {
              const log = logs.find(l => l.habitId === habit.id);
              let isDone = false;
              if (habit.habitType === "positive") isDone = !!log?.completed;
              if (habit.habitType === "avoidance") isDone = !log || log.completed;
              if (habit.habitType === "numeric" && habit.numericTarget) {
                isDone = (log?.numericValue || 0) >= habit.numericTarget;
              }

              return (
                <Pressable 
                  key={habit.id}
                  onLongPress={() => setActiveLogHabit(habit)}
                  onPress={() => handleQuickToggleHabit(habit)}
                  style={{
                    flexDirection: "column",
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDone ? colors.success + "50" : colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Text style={{ fontSize: 24, opacity: isDone ? 0.6 : 1 }}>{habit.emoji}</Text>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: isDone ? colors.muted : colors.foreground, textDecorationLine: isDone && habit.habitType !== 'avoidance' ? "line-through" : "none" }}>{habit.name}</Text>
                        <Text style={{ fontSize: 12, color: colors.muted }}>{habit.category}</Text>
                      </View>
                    </View>
                    
                    {/* Status Indicator */}
                    <Pressable onPress={() => setActiveLogHabit(habit)} style={{ padding: 8 }}>
                      {habit.habitType === "positive" && (
                        <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: isDone ? colors.success : colors.border, backgroundColor: isDone ? colors.success : "transparent", alignItems: "center", justifyContent: "center" }}>
                          {isDone && <IconSymbol name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                      )}
                      {habit.habitType === "avoidance" && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {isDone ? (
                            <><IconSymbol name="shield.fill" size={20} color={colors.success} /><Text style={{ color: colors.success, fontSize: 12, fontWeight: "600" }}>SAFE</Text></>
                          ) : (
                            <><IconSymbol name="shield.slash.fill" size={20} color={colors.error} /><Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>SLIP</Text></>
                          )}
                        </View>
                      )}
                      {habit.habitType === "numeric" && (
                        <View style={{ backgroundColor: isDone ? colors.success + "20" : colors.primary + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: isDone ? colors.success : colors.primary }}>
                            {log?.numericValue || 0} / {habit.numericTarget}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                  
                  {log?.note && (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.surface, borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, color: colors.muted, fontStyle: "italic" }}>"{log.note}"</Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>

        {/* SECTION: DAILY TASKS */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>To-Do List</Text>
          
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            <TextInput
              placeholder="Add a task..."
              value={newTask}
              onChangeText={setNewTask}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.foreground }}
              placeholderTextColor={colors.muted}
            />
            <Pressable onPress={handleAddTask} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
              <IconSymbol name="plus" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {todayTasks.length === 0 ? (
            <EmptyState icon="list.bullet" title="No tasks" subtitle="Add a task to get started" />
          ) : (
            todayTasks.map((task) => (
              <View key={task.id} style={{ flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: colors.background, borderRadius: 12, marginBottom: 8, borderWidth: 0.5, borderColor: colors.border }}>
                <Pressable onPress={() => handleToggleTask(task.id)} style={{ marginRight: 12 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: task.completed ? colors.success : colors.border, backgroundColor: task.completed ? colors.success : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {task.completed && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
                <Text style={{ flex: 1, fontSize: 15, color: task.completed ? colors.muted : colors.foreground, textDecorationLine: task.completed ? "line-through" : "none" }}>{task.title}</Text>
                <Pressable onPress={() => handleDeleteTask(task.id)} style={{ padding: 4 }}>
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </Pressable>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Habit Log Modal (Full CRUD) */}
      <HabitLogModal 
        visible={!!activeLogHabit}
        onClose={() => setActiveLogHabit(null)}
        habit={activeLogHabit}
        date={selectedDate}
        log={activeLogHabit ? logs.find(l => l.habitId === activeLogHabit.id) || null : null}
        onSave={() => loadData(selectedDate)}
      />

      {/* Modals from old daily logic */}
      <BottomSheetModal visible={showCarryOver} onClose={() => setShowCarryOver(false)} title="Unfinished Tasks" maxHeight="80%">
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>{carryOverTasks.length} task(s) from yesterday are unfinished. Carry them over?</Text>
        <ScrollView contentContainerStyle={{ marginBottom: 16, maxHeight: 200 }}>
          {carryOverTasks.map((task) => (
            <View key={task.id} style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: colors.surface, borderRadius: 10, marginBottom: 6 }}>
              <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }}>{task.title}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={() => { setShowCarryOver(false); setCarryOverTasks([]); }} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Discard</Text>
          </Pressable>
          <Pressable onPress={() => handleCarryOver(carryOverTasks.map((t) => t.id))} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Carry Over</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      <BottomSheetModal visible={!!showReport} onClose={() => setShowReport(null)} title="Yesterday's Report">
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>{showReport?.date}</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Total Tasks</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{showReport?.totalTasks}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Completed</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>{showReport?.completedTasks}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Unfinished</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}>{(showReport?.totalTasks || 0) - (showReport?.completedTasks || 0)}</Text>
          </View>
        </View>
        <Pressable onPress={() => setShowReport(null)} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Got it!</Text>
        </Pressable>
      </BottomSheetModal>

    </ScreenContainer>
  );
}
