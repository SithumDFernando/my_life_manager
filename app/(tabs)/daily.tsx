import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { tasks, dailyReports, settings as settingsStorage } from "@/lib/storage";
import type { Task, DailyReport } from "@/lib/types";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function DailyScreen() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [showReport, setShowReport] = useState<DailyReport | null>(null);
  const [newTask, setNewTask] = useState("");
  const [showCarryOver, setShowCarryOver] = useState(false);
  const [carryOverTasks, setCarryOverTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const checkDayAndLoad = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const currentSettings = await settingsStorage.get();

    if (currentSettings.lastOpenDate && currentSettings.lastOpenDate !== today) {
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
      await settingsStorage.save({ lastOpenDate: today });
      await tasks.clearCompleted();
      const remainingTasks = await tasks.getAll();
      setTodayTasks(remainingTasks);

      if (unfinished.length > 0) {
        setCarryOverTasks(unfinished);
        setShowCarryOver(true);
      } else {
        setShowReport(report);
      }
    } else {
      const allTasks = await tasks.getAll();
      setTodayTasks(allTasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      if (!currentSettings.lastOpenDate) {
        await settingsStorage.save({ lastOpenDate: today });
      }
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => { checkDayAndLoad(); }, [checkDayAndLoad])
  );

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await tasks.add(newTask.trim());
    setNewTask("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await tasks.getAll();
    setTodayTasks(updated.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  };

  const handleToggle = async (id: string) => {
    await tasks.toggle(id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await tasks.getAll();
    setTodayTasks(updated.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Task", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await tasks.delete(id);
          const updated = await tasks.getAll();
          setTodayTasks(updated.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        },
      },
    ]);
  };

  const handleCarryOver = async (taskIds: string[]) => {
    await tasks.carryOver(taskIds);
    setShowCarryOver(false);
    setCarryOverTasks([]);
    const updated = await tasks.getAll();
    setTodayTasks(updated.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;

  if (loading) {
    return (
      <ScreenContainer className="px-5">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 15, color: "#8B8FA3" }}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5">
      <View style={{ paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 14, color: "#8B8FA3" }}>{today}</Text>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E" }}>Daily Tasks</Text>
        {totalCount > 0 && (
          <Text style={{ fontSize: 13, color: "#34D399", marginTop: 4 }}>
            {completedCount}/{totalCount} completed
          </Text>
        )}
      </View>

      {/* Add Task Input */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TextInput
          placeholder="Add a task..."
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
          style={{
            flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1A1A2E",
          }}
          placeholderTextColor="#8B8FA3"
        />
        <Pressable
          onPress={handleAddTask}
          style={({ pressed }) => ({
            width: 46, height: 46, borderRadius: 12, backgroundColor: "#5B8DEF",
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Tasks */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {todayTasks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="list.bullet" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No tasks for today</Text>
            <Text style={{ fontSize: 13, color: "#8B8FA3", marginTop: 4 }}>Add a task to get started</Text>
          </View>
        ) : (
          todayTasks.map((task) => (
            <View
              key={task.id}
              style={{
                flexDirection: "row", alignItems: "center", padding: 12,
                backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8,
                borderWidth: 0.5, borderColor: "#E8EAED",
              }}
            >
              <Pressable onPress={() => handleToggle(task.id)} style={{ marginRight: 12 }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2, borderColor: task.completed ? "#34D399" : "#E8EAED",
                  backgroundColor: task.completed ? "#34D399" : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {task.completed && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
                </View>
              </Pressable>
              <Text style={{
                flex: 1, fontSize: 15, color: task.completed ? "#8B8FA3" : "#1A1A2E",
                textDecorationLine: task.completed ? "line-through" : "none",
              }}>
                {task.title}
              </Text>
              <Pressable onPress={() => handleDelete(task.id)} style={{ padding: 4 }}>
                <IconSymbol name="trash" size={18} color="#F87171" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Carry Over Modal */}
      <Modal visible={showCarryOver} animationType="slide" transparent onRequestClose={() => setShowCarryOver(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: "80%" }}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 }}>
              Unfinished Tasks
            </Text>
            <Text style={{ fontSize: 14, color: "#8B8FA3", marginBottom: 16 }}>
              {carryOverTasks.length} task(s) from yesterday are unfinished. Carry them over?
            </Text>
            <ScrollView contentContainerStyle={{ marginBottom: 16, maxHeight: 200 }}>
              {carryOverTasks.map((task) => (
                <View key={task.id} style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#F7F8FA", borderRadius: 10, marginBottom: 6 }}>
                  <Text style={{ flex: 1, fontSize: 14, color: "#1A1A2E" }}>{task.title}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable onPress={() => { setShowCarryOver(false); setCarryOverTasks([]); }}
                style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B8FA3" }}>Discard</Text>
              </Pressable>
              <Pressable onPress={() => handleCarryOver(carryOverTasks.map((t) => t.id))}
                style={{ flex: 1, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Carry Over</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={!!showReport} animationType="slide" transparent onRequestClose={() => setShowReport(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 }}>Yesterday's Report</Text>
            <Text style={{ fontSize: 14, color: "#8B8FA3", marginBottom: 16 }}>{showReport?.date}</Text>
            <View style={{ backgroundColor: "#F7F8FA", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: "#8B8FA3" }}>Total Tasks</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#1A1A2E" }}>{showReport?.totalTasks}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: "#8B8FA3" }}>Completed</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#34D399" }}>{showReport?.completedTasks}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 14, color: "#8B8FA3" }}>Unfinished</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FBBF24" }}>
                  {(showReport?.totalTasks || 0) - (showReport?.completedTasks || 0)}
                </Text>
              </View>
            </View>
            {showReport && showReport.unfinishedTasks && showReport.unfinishedTasks.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginBottom: 8 }}>Unfinished Tasks:</Text>
                {showReport.unfinishedTasks.map((t) => (
                  <View key={t.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FBBF24", marginRight: 8 }} />
                    <Text style={{ fontSize: 13, color: "#8B8FA3" }}>{t.title}</Text>
                  </View>
                ))}
              </View>
            )}
            <Pressable onPress={() => setShowReport(null)}
              style={{ backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Got it!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
