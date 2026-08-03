import { useState, useEffect } from "react";
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

  useEffect(() => {
    checkDayAndLoad();
  }, []);

  const checkDayAndLoad = async () => {
    const today = new Date().toISOString().split("T")[0];
    const currentSettings = await settingsStorage.get();

    if (currentSettings.lastOpenDate && currentSettings.lastOpenDate !== today) {
      // It's a new day — generate yesterday's report
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

      // Clear completed tasks
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
  };

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

  const handleCarryOver = async (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      await tasks.carryOver(selectedIds);
    }
    const updated = await tasks.getAll();
    setTodayTasks(updated.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    setShowCarryOver(false);
    const latestReport = await dailyReports.getLatestReport();
    setShowReport(latestReport);
  };

  const today = new Date();
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;

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
      {/* Header */}
      <View style={{ paddingTop: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, color: "#8B8FA3", fontWeight: "500" }}>
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E", marginTop: 4 }}>Daily Tasks</Text>

        {/* Progress Bar */}
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, height: 6, backgroundColor: "#F7F8FA", borderRadius: 3 }}>
            {total > 0 ? (
              <View style={{
                width: `${(completedCount / total) * 100}%`, height: "100%",
                backgroundColor: "#5B8DEF", borderRadius: 3,
              }} />
            ) : null}
          </View>
          <Text style={{ fontSize: 13, color: "#8B8FA3", fontWeight: "500" }}>{completedCount}/{total}</Text>
        </View>
      </View>

      {/* Add Task */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <TextInput
          placeholder="Add a new task..."
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
          style={{
            flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 14, color: "#1A1A2E",
          }}
          placeholderTextColor="#8B8FA3"
        />
        <Pressable
          onPress={handleAddTask}
          style={({ pressed }) => ({
            width: 48, height: 48, borderRadius: 12, backgroundColor: "#5B8DEF",
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Task List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {todayTasks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="checkmark.circle.fill" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No tasks yet. Add your first task!</Text>
          </View>
        ) : (
          todayTasks.map((task) => (
            <View key={task.id} style={{
              flexDirection: "row", alignItems: "center", padding: 14,
              backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8,
              borderWidth: 0.5, borderColor: "#E8EAED",
            }}>
              <Pressable
                onPress={() => handleToggle(task.id)}
                style={({ pressed }) => ({
                  width: 26, height: 26, borderRadius: 13, marginRight: 12,
                  borderWidth: 2,
                  borderColor: task.completed ? "#34D399" : "#E8EAED",
                  backgroundColor: task.completed ? "#34D399" : "transparent",
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {task.completed ? <IconSymbol name="checkmark" size={16} color="#FFFFFF" /> : null}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15, color: task.completed ? "#8B8FA3" : "#1A1A2E",
                  textDecorationLine: task.completed ? "line-through" : "none",
                }}>
                  {task.title}
                </Text>
                {task.carriedOver ? (
                  <Text style={{ fontSize: 11, color: "#5B8DEF", marginTop: 2 }}>Carried over from yesterday</Text>
                ) : null}
              </View>
              <Pressable onPress={() => handleDelete(task.id)} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
                <IconSymbol name="xmark" size={18} color="#F87171" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Carry Over Modal */}
      <Modal visible={showCarryOver} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 }}>Yesterday's Unfinished Tasks</Text>
            <Text style={{ fontSize: 14, color: "#8B8FA3", marginBottom: 16 }}>
              You have {carryOverTasks.length} task{carryOverTasks.length !== 1 ? "s" : ""} that weren't completed. Add them to today?
            </Text>

            <View style={{ maxHeight: 200 }}>
              {carryOverTasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => {
                    const isSelected = carryOverTasks.some((t) => t.id === task.id);
                    // Toggle selection via a separate state would be better, but for simplicity carry all
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10,
                    backgroundColor: "#F7F8FA", marginBottom: 6, opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#5B8DEF", marginRight: 10 }} />
                  <Text style={{ fontSize: 14, color: "#1A1A2E", flex: 1 }}>{task.title}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Pressable
                onPress={() => setShowCarryOver(false)}
                style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B8FA3" }}>Skip</Text>
              </Pressable>
              <Pressable
                onPress={() => handleCarryOver(carryOverTasks.map((t) => t.id))}
                style={{ flex: 1, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Add All</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievement Report Modal */}
      <Modal visible={!!showReport && !showCarryOver} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <IconSymbol name="star.fill" size={40} color="#FBBF24" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8, textAlign: "center" }}>
              Yesterday's Report
            </Text>
            <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 20, textAlign: "center" }}>
              {showReport?.date}
            </Text>

            <View style={{ backgroundColor: "#F7F8FA", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: "#8B8FA3" }}>Total Tasks</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A1A2E" }}>{showReport?.totalTasks}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: "#8B8FA3" }}>Completed</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#34D399" }}>{showReport?.completedTasks}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 14, color: "#8B8FA3" }}>Unfinished</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#F87171" }}>
                  {showReport ? showReport.totalTasks - showReport.completedTasks : 0}
                </Text>
              </View>
            </View>

            {/* Progress Circle */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 32, fontWeight: "700", color: "#5B8DEF" }}>
                {showReport && showReport.totalTasks > 0
                  ? `${Math.round((showReport.completedTasks / showReport.totalTasks) * 100)}%`
                  : "0%"}
              </Text>
              <Text style={{ fontSize: 13, color: "#8B8FA3" }}>completion rate</Text>
            </View>

            <Pressable
              onPress={() => setShowReport(null)}
              style={{ backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Got it!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
