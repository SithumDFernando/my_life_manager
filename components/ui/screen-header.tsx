import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  actionIcon?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
}

export function ScreenHeader({
  title,
  showBack = false,
  actionIcon,
  actionLabel,
  onActionPress,
  actionDisabled = false,
}: ScreenHeaderProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
        )}
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: showBack ? 12 : 0 }}>
          {title}
        </Text>
      </View>

      {(actionIcon || actionLabel) && onActionPress && (
        <Pressable
          onPress={onActionPress}
          disabled={actionDisabled}
          style={({ pressed }) => ({
            padding: actionLabel ? 8 : undefined,
            width: actionIcon && !actionLabel ? 36 : undefined,
            height: actionIcon && !actionLabel ? 36 : undefined,
            borderRadius: actionLabel ? 10 : 18,
            backgroundColor: actionDisabled ? colors.surface : colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed && !actionDisabled ? 0.8 : 1,
          })}
        >
          {actionLabel ? (
            <Text style={{ fontSize: 14, fontWeight: "600", color: actionDisabled ? colors.muted : "#FFFFFF" }}>
              {actionLabel}
            </Text>
          ) : (
            <IconSymbol name={actionIcon as any} size={20} color={actionDisabled ? colors.muted : "#FFFFFF"} />
          )}
        </Pressable>
      )}
    </View>
  );
}
