import React from "react";
import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { DatePickerFieldProps } from "./date-picker-field";

export function DatePickerField({
  label,
  value,
  onChange,
  onDateChange,
  placeholder = "Select date",
  mode = "date",
}: DatePickerFieldProps) {
  const colors = useColors();

  const handleValueChange = (val: string) => {
    if (onChange) onChange(val);
    if (onDateChange) onDateChange(val);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
          justifyContent: "center",
        }}
      >
        <input
          type={mode === "time" ? "time" : "date"}
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => handleValueChange(e.target.value)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: value ? colors.foreground : colors.muted,
            fontSize: "14px",
            fontFamily: "inherit",
            cursor: "pointer",
            colorScheme: colors.background === "#151718" ? "dark" : "light",
          }}
        />
      </View>
    </View>
  );
}
