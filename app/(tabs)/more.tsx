import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { bioData, notes, competitions, events, venues, pinStorage } from "@/lib/storage";
import { settings as settingsStorage } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function MoreScreen() {
  const router = useRouter();
  const [bio, setBio] = useState<any>(null);
  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinStep, setPinStep] = useState<"old" | "new" | "confirm">("old");
  const [pinError, setPinError] = useState("");

  const loadBio = useCallback(async () => {
    const data = await bioData.get();
    setBio(data);
  }, []);

  useFocusEffect(
    useCallback(() => { loadBio(); }, [loadBio])
  );

  const sections = [
    { title: "Bio Data", subtitle: bio ? "View & edit profile" : "Add your profile", icon: "person.fill", color: "#5B8DEF", route: "/(more)/bio" },
    { title: "Notes", subtitle: "Quick notes", icon: "doc.fill", color: "#FBBF24", route: "/(more)/notes" },
    { title: "Competitions", subtitle: "Events & contests", icon: "trophy.fill", color: "#FBBF24", route: "/(more)/competitions" },
    { title: "Events", subtitle: "Upcoming events", icon: "calendar", color: "#5B8DEF", route: "/(more)/events" },
    { title: "Venues", subtitle: "Locations", icon: "map.pin", color: "#F87171", route: "/(more)/venues" },
    { title: "Change PIN", subtitle: "Security settings", icon: "lock.fill", color: "#34D399", route: null },
    { title: "Backup & Restore", subtitle: "Export / import data", icon: "square.and.arrow.up", color: "#5B8DEF", route: "/(more)/backup" },
  ];

  const handleSectionPress = (section: typeof sections[0]) => {
    if (section.route) {
      router.push(section.route as any);
    } else if (section.title === "Change PIN") {
      setShowChangePin(true);
      setPinStep("old");
      setOldPin("");
      setNewPin("");
      setConfirmNewPin("");
      setPinError("");
    }
  };

  const handlePinChange = async () => {
    if (pinStep === "old") {
      const isValid = await pinStorage.verify(oldPin);
      if (!isValid) {
        setPinError("Incorrect PIN");
        return;
      }
      setPinError("");
      setPinStep("new");
    } else if (pinStep === "new") {
      if (newPin.length !== 6) {
        setPinError("PIN must be 6 digits");
        return;
      }
      setPinError("");
      setPinStep("confirm");
    } else if (pinStep === "confirm") {
      if (newPin !== confirmNewPin) {
        setPinError("PINs don't match");
        setConfirmNewPin("");
        return;
      }
      await pinStorage.set(newPin);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "PIN changed successfully!");
      setShowChangePin(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    setPinError("");
    if (pinStep === "old") {
      if (oldPin.length < 6) setOldPin(oldPin + digit);
    } else if (pinStep === "new") {
      if (newPin.length < 6) setNewPin(newPin + digit);
    } else {
      if (confirmNewPin.length < 6) setConfirmNewPin(confirmNewPin + digit);
    }
  };

  const handlePinDelete = () => {
    if (pinStep === "old") setOldPin(oldPin.slice(0, -1));
    else if (pinStep === "new") setNewPin(newPin.slice(0, -1));
    else setConfirmNewPin(confirmNewPin.slice(0, -1));
  };

  const getPinTitle = () => pinStep === "old" ? "Enter Current PIN" : pinStep === "new" ? "Set New PIN" : "Confirm New PIN";
  const getCurrentPin = () => pinStep === "old" ? oldPin : pinStep === "new" ? newPin : confirmNewPin;

  return (
    <ScreenContainer className="px-5">
      <View style={{ paddingTop: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E" }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Bio Profile Preview */}
        {bio && (
          <Pressable
            onPress={() => router.push("/(more)/bio" as any)}
            style={({ pressed }) => ({
              backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 16,
              borderWidth: 0.5, borderColor: "#E8EAED",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#5B8DEF15", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#5B8DEF" }}>
                  {bio.fullName ? bio.fullName.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>{bio.fullName || "Your Profile"}</Text>
                {bio.education ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>{bio.education}</Text> : null}
                {bio.email ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>{bio.email}</Text> : null}
              </View>
              <IconSymbol name="pencil" size={18} color="#5B8DEF" />
            </View>
          </Pressable>
        )}

        {/* Sections */}
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

      {/* Change PIN Modal */}
      <Modal visible={showChangePin} animationType="slide" transparent onRequestClose={() => setShowChangePin(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 }}>{getPinTitle()}</Text>

            {/* PIN Dots */}
            <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 16 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: i < getCurrentPin().length ? "#5B8DEF" : "#E8EAED",
                }} />
              ))}
            </View>

            {pinError ? <Text style={{ fontSize: 13, color: "#F87171", textAlign: "center", marginBottom: 12 }}>{pinError}</Text> : null}

            {/* Numpad */}
            <View>
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"],
                ["", "0", "del"],
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "center", marginBottom: 10 }}>
                  {row.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        if (key === "del") handlePinDelete();
                        else if (key !== "") handlePinDigit(key);
                      }}
                      style={({ pressed }) => ({
                        width: 64, height: 64, borderRadius: 32,
                        marginHorizontal: 10, alignItems: "center", justifyContent: "center",
                        backgroundColor: pressed ? "#E8EAED" : "transparent",
                      })}
                    >
                      {key === "del" ? (
                        <IconSymbol name="xmark" size={20} color="#1A1A2E" />
                      ) : key === "" ? null : (
                        <Text style={{ fontSize: 24, color: "#1A1A2E" }}>{key}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            <Pressable onPress={() => setShowChangePin(false)} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 14, color: "#8B8FA3", textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
