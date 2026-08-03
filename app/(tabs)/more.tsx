import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { bioData, notes, competitions, events, venues, pinStorage } from "@/lib/storage";
import type { Note, Competition, Event, Venue } from "@/lib/types";
import { settings as settingsStorage } from "@/lib/storage";

export default function MoreScreen() {
  const router = useRouter();
  const [bio, setBio] = useState<any>(null);

  const sections = [
    { title: "Bio Data", subtitle: "Personal information", icon: "person.fill", color: "#5B8DEF", route: "/(more)/bio" },
    { title: "Notes", subtitle: "Quick notes", icon: "doc.fill", color: "#FBBF24", route: "/(more)/notes" },
    { title: "Competitions", subtitle: "Events & contests", icon: "trophy.fill", color: "#FBBF24", route: "/(more)/competitions" },
    { title: "Events", subtitle: "Upcoming events", icon: "calendar", color: "#5B8DEF", route: "/(more)/events" },
    { title: "Venues", subtitle: "Locations", icon: "map.pin", color: "#F87171", route: "/(more)/venues" },
    { title: "Change PIN", subtitle: "Security settings", icon: "lock.fill", color: "#34D399", route: null },
  ];

  const handleSectionPress = (section: typeof sections[0]) => {
    if (section.route) {
      router.push(section.route as any);
    } else if (section.title === "Change PIN") {
      Alert.alert("Change PIN", "This will reset your PIN. A new PIN will be set on next launch.", [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: async () => {
          await pinStorage.remove();
          await settingsStorage.save({ pinSet: false });
        }},
      ]);
    }
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ paddingTop: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E" }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {sections.map((section) => (
          <Pressable
            key={section.title}
            onPress={() => handleSectionPress(section)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", padding: 16,
              backgroundColor: "#FFFFFF", borderRadius: 14, marginBottom: 10,
              borderWidth: 0.5, borderColor: "#E8EAED",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: section.color + "15",
              alignItems: "center", justifyContent: "center", marginRight: 14,
            }}>
              <IconSymbol name={section.icon} size={22} color={section.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>{section.title}</Text>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginTop: 2 }}>{section.subtitle}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#8B8FA3" />
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
