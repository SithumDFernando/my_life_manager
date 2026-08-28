import React from "react";
import { View, TextInput, Pressable } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = "Search..." }: SearchBarProps) {
  const colors = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          flex: 1,
          marginLeft: 8,
          fontSize: 15,
          color: colors.foreground,
          padding: 0,
        }}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          style={({ pressed }) => ({
            padding: 4,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}
