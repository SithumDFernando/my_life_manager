import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Platform } from "react-native";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { useColors } from "@/hooks/use-colors";
import type { Habit, HabitLog } from "@/lib/types";
import { habitLogs } from "@/lib/habit-storage";
import { showAlert } from "@/lib/alert";
import * as Haptics from "expo-haptics";

interface HabitLogModalProps {
  visible: boolean;
  onClose: () => void;
  habit: Habit | null;
  date: string;
  log: HabitLog | null;
  onSave: () => void;
}

export function HabitLogModal({ visible, onClose, habit, date, log, onSave }: HabitLogModalProps) {
  const colors = useColors();
  const [note, setNote] = useState("");
  const [numericValue, setNumericValue] = useState("");

  useEffect(() => {
    if (visible && log) {
      setNote(log.note || "");
      setNumericValue(log.numericValue ? String(log.numericValue) : "");
    } else if (visible) {
      setNote("");
      setNumericValue("");
    }
  }, [visible, log]);

  if (!habit) return null;

  const handleSaveNumeric = async () => {
    const val = parseFloat(numericValue);
    if (!isNaN(val)) {
      await habitLogs.setNumericValue(habit.id, date, val, note);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
      onClose();
    } else {
      showAlert("Invalid Input", "Please enter a valid number.");
    }
  };

  const handleToggle = async (status: boolean) => {
    if (log) {
      await habitLogs.updateLog(habit.id, date, { completed: status, note });
    } else {
      if (habit.habitType === "avoidance" && !status) {
        await habitLogs.logSlip(habit.id, date, note);
      } else {
        await habitLogs.toggleCompletion(habit.id, date, note);
        // Force the completed status for avoidance if explicitly marked safe
        if (habit.habitType === "avoidance" && status) {
          await habitLogs.updateLog(habit.id, date, { completed: true, note });
        }
      }
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave();
    onClose();
  };

  const handleDelete = () => {
    showAlert("Reset Day", "Are you sure you want to delete this log and reset the day?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await habitLogs.removeLog(habit.id, date);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSave();
          onClose();
        },
      },
    ]);
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Manage Habit Log">
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
          {habit.emoji} {habit.name}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Date: {date}</Text>
      </View>

      {habit.habitType === "numeric" ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Exact Value ({habit.numericUnit})</Text>
          <TextInput
            value={numericValue}
            onChangeText={setNumericValue}
            keyboardType="numeric"
            placeholder={`Target: ${habit.numericTarget}`}
            placeholderTextColor={colors.muted}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          />
          <Pressable
            onPress={handleSaveNumeric}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              marginBottom: 16,
            })}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>Save Value</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {habit.habitType === "positive" ? (
            <>
              <Pressable
                onPress={() => handleToggle(true)}
                style={{
                  flex: 1,
                  backgroundColor: colors.success,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Complete</Text>
              </Pressable>
              <Pressable
                onPress={() => handleToggle(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "600" }}>Incomplete</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => handleToggle(true)}
                style={{
                  flex: 1,
                  backgroundColor: colors.success,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Safe</Text>
              </Pressable>
              <Pressable
                onPress={() => handleToggle(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.error,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "600" }}>Log Slip</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Note / Reflection</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="How did it go?"
          placeholderTextColor={colors.muted}
          multiline
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 80,
            textAlignVertical: "top",
          }}
        />
      </View>

      {log && (
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => ({
            backgroundColor: colors.error + "20",
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: colors.error, fontSize: 15, fontWeight: "600" }}>Delete Log (Undo)</Text>
        </Pressable>
      )}
    </BottomSheetModal>
  );
}
