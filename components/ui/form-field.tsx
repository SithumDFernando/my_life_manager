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
  error?: string;
  required?: boolean;
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
  error,
  required = false,
}: FormFieldProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
          {required && <Text style={{ fontSize: 13, color: colors.error, marginLeft: 3 }}>*</Text>}
        </View>
      )}
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
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
        }}
      />
      {!!error && (
        <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
