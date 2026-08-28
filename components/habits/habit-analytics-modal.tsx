import React from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Habit, HabitStats } from "@/lib/types";

interface HabitAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  habit: Habit | null;
  stats: HabitStats | null;
}

export function HabitAnalyticsModal({ visible, onClose, habit, stats }: HabitAnalyticsModalProps) {
  const colors = useColors();

  if (!habit || !stats) return null;

  const StatBox = ({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <View
      style={{
        width: "48%",
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
        <IconSymbol name={icon} size={16} color={color} />
        <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "500" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>{value}</Text>
    </View>
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Habit Analytics" scrollable>
      <View style={{ alignItems: "center", marginBottom: 24, marginTop: 8 }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>{habit.emoji}</Text>
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
          {habit.name}
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
          {habit.category} • {habit.targetName || "No Target"}
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        <StatBox
          icon="flame.fill"
          label="Current Streak"
          value={stats.currentStreak}
          color="#FF9500" // Orange
        />
        <StatBox
          icon="trophy.fill"
          label="Longest Streak"
          value={stats.longestStreak}
          color="#FFD700" // Gold
        />
        <StatBox
          icon="chart.pie.fill"
          label="Consistency (30d)"
          value={`${stats.consistencyScore}%`}
          color={colors.primary}
        />
        <StatBox
          icon="checkmark.seal.fill"
          label="Total Completions"
          value={stats.totalCompletions}
          color={colors.success}
        />
        <StatBox
          icon="star.fill"
          label="Total XP Earned"
          value={stats.totalXP}
          color="#A259FF" // Purple
        />
        <StatBox
          icon="shield.fill"
          label="Shields (Weekly)"
          value={stats.streakShieldsRemaining}
          color={colors.primary}
        />
      </View>

      {stats.lastCompletionDate && (
        <View style={{ marginTop: 8, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            Last completed: {stats.lastCompletionDate}
          </Text>
        </View>
      )}
    </BottomSheetModal>
  );
}
