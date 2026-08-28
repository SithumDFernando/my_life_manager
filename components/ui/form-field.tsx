import React from "react";
import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: FormFieldProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: colors.foreground,
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? 100 : 42,
        }}
      />
    </View>
  );
}
