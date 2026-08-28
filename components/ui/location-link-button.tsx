import React from "react";
import { Pressable, Text, Linking, Alert } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface LocationLinkButtonProps {
  address?: string;
  mapUrl?: string;
}

export function LocationLinkButton({ address, mapUrl }: LocationLinkButtonProps) {
  const colors = useColors();

  if (!address && !mapUrl) return null;

  const handlePress = async () => {
    let url = mapUrl;
    if (!url && address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }

    if (!url) return;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open maps link on this device.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to open maps.");
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: colors.primary + "15",
        borderRadius: 8,
        alignSelf: "flex-start",
        marginTop: 6,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <IconSymbol name="map.fill" size={14} color={colors.primary} />
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
        Open in Maps
      </Text>
    </Pressable>
  );
}
