import React, { useState } from "react";
import { View, Text, Pressable, Platform, useColorScheme } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/use-colors";

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO string "YYYY-MM-DD"
  onChange: (isoDate: string) => void;
  placeholder?: string;
  mode?: "date" | "time";
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  mode = "date",
}: DatePickerFieldProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [show, setShow] = useState(false);

  const dateObject = value ? new Date(value) : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      // Create YYYY-MM-DD format preserving local time
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12, // slightly taller for tap target
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 14, color: value ? colors.foreground : colors.muted }}>
          {displayValue || placeholder}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={dateObject}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          themeVariant={colorScheme === "dark" ? "dark" : "light"}
        />
      )}
    </View>
  );
}
