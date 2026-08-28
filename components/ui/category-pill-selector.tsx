import React from "react";
import { ScrollView, Text, Pressable, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export interface CategoryOption {
  key: string;
  label: string;
  icon?: string;
}

interface CategoryPillSelectorProps {
  options: CategoryOption[];
  selected: string;
  onSelect: (key: string) => void;
  scrollable?: boolean;
}

export function CategoryPillSelector({
  options,
  selected,
  onSelect,
  scrollable = true,
}: CategoryPillSelectorProps) {
  const colors = useColors();

  const renderPills = () => (
    <>
      {options.map((opt) => {
        const isSelected = selected === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: isSelected ? colors.primary : colors.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: opt.icon ? 6 : 0,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {opt.icon && (
              <IconSymbol 
                name={opt.icon as any} 
                size={14} 
                color={isSelected ? "#FFF" : colors.muted} 
              />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: isSelected ? "#FFF" : colors.muted,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {renderPills()}
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {renderPills()}
    </View>
  );
}
