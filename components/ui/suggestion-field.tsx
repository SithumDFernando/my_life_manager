import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface SuggestionFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function SuggestionField({
  label,
  value,
  onChangeText,
  suggestions,
  placeholder,
  required,
  error,
}: SuggestionFieldProps) {
  const colors = useColors();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      const lowerVal = value.toLowerCase();
      const matches = suggestions.filter(
        (s) => s.toLowerCase().includes(lowerVal) && s.toLowerCase() !== lowerVal
      );
      setFiltered(matches);
    } else {
      setFiltered(suggestions);
    }
  }, [value, suggestions]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>
        {label} {required && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
        }}
      />
      {error ? <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>{error}</Text> : null}

      {showSuggestions && filtered.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {filtered.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  onChangeText(s);
                  setShowSuggestions(false);
                }}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary + "15",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary + "30",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
