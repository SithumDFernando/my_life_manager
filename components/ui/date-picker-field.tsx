import React, { useState } from "react";
import { View, Text, Pressable, Platform, useColorScheme } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/use-colors";

export interface DatePickerFieldProps {
  label: string;
  value: string; // "YYYY-MM-DD" or "HH:mm"
  onChange?: (isoDate: string) => void;
  onDateChange?: (isoDate: string) => void;
  placeholder?: string;
  mode?: "date" | "time";
}

export function DatePickerField({
  label,
  value,
  onChange,
  onDateChange,
  placeholder = "Select date",
  mode = "date",
}: DatePickerFieldProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [show, setShow] = useState(false);

  const handleCallback = (val: string) => {
    if (onChange) onChange(val);
    if (onDateChange) onDateChange(val);
  };

  // Web fallback: Render native HTML5 date/time picker input
  if (Platform.OS === "web") {
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
            onChange={(e: any) => handleCallback(e.target.value)}
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

  const getDateObject = () => {
    if (!value) return new Date();
    if (mode === "time" && value.includes(":")) {
      const [h, m] = value.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const dateObject = getDateObject();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (event.type === "dismissed") {
      setShow(false);
      return;
    }
    if (selectedDate) {
      if (mode === "time") {
        const hours = String(selectedDate.getHours()).padStart(2, "0");
        const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
        handleCallback(`${hours}:${minutes}`);
      } else {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        handleCallback(`${year}-${month}-${day}`);
      }
    }
  };

  const displayValue = value
    ? mode === "time"
      ? value
      : new Date(value).toLocaleDateString(undefined, {
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
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: colors.border,
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
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          themeVariant={colorScheme === "dark" ? "dark" : "light"}
        />
      )}
    </View>
  );
}
