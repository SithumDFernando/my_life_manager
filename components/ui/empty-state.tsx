import React from "react";
import { View, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 }}>
      <IconSymbol name={icon as any} size={48} color={colors.border} />
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 16, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
