import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { bioData, pinStorage } from "@/lib/storage";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";
import { Platform, useColorScheme as useSystemColorScheme } from "react-native";
import type { ColorScheme } from "@/constants/theme";

type ThemeOption = "light" | "dark" | "system";

export default function MoreScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const systemScheme = useSystemColorScheme() ?? "light";
  const [bio, setBio] = useState<any>(null);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeOption>(colorScheme === systemScheme ? "system" : colorScheme);
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
    { title: "Bio Data", subtitle: bio ? "View & edit profile" : "Add your profile", icon: "person.fill", color: colors.primary, route: "/(more)/bio" },
    { title: "Notes", subtitle: "Quick notes", icon: "doc.fill", color: colors.warning, route: "/(more)/notes" },
    { title: "Competitions", subtitle: "Events & contests", icon: "trophy.fill", color: colors.warning, route: "/(more)/competitions" },
    { title: "Events", subtitle: "Upcoming events", icon: "calendar", color: colors.primary, route: "/(more)/events" },
    { title: "Venues", subtitle: "Locations", icon: "map.pin", color: colors.error, route: "/(more)/venues" },
    { title: "Change PIN", subtitle: "Security settings", icon: "lock.fill", color: colors.success, route: null },
    { title: "Appearance", subtitle: colorScheme === "dark" ? "Dark mode" : "Light mode", icon: "moon.fill", color: colors.primary, route: null, action: "theme" },
    { title: "Backup & Restore", subtitle: "Export / import data", icon: "square.and.arrow.up", color: colors.primary, route: "/(more)/backup" },
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
    } else if ((section as any).action === "theme") {
      setShowThemePicker(true);
    }
  };

  const handleThemeChange = (mode: ThemeOption) => {
    setThemeMode(mode);
    if (mode === "system") {
      setColorScheme(systemScheme as ColorScheme);
    } else {
      setColorScheme(mode as ColorScheme);
    }
    setShowThemePicker(false);
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
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Bio Profile Preview */}
        {bio && (
          <Pressable
            onPress={() => router.push("/(more)/bio" as any)}
            style={({ pressed }) => ({
              backgroundColor: colors.background, borderRadius: 14, padding: 16, marginBottom: 16,
              borderWidth: 0.5, borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>
                  {bio.fullName ? bio.fullName.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{bio.fullName || "Your Profile"}</Text>
                {bio.education ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{bio.education}</Text> : null}
                {bio.email ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{bio.email}</Text> : null}
              </View>
              <IconSymbol name="pencil" size={18} color={colors.primary} />
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
              backgroundColor: colors.background, borderRadius: 14, marginBottom: 10,
              borderWidth: 0.5, borderColor: colors.border,
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
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{section.title}</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{section.subtitle}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} animationType="slide" transparent onRequestClose={() => setShowThemePicker(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>Appearance</Text>
            {([
              { key: "light" as ThemeOption, label: "Light", icon: "sun.max.fill" },
              { key: "dark" as ThemeOption, label: "Dark", icon: "moon.fill" },
              { key: "system" as ThemeOption, label: "System Default", icon: "gear" },
            ]).map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => handleThemeChange(opt.key)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12,
                  backgroundColor: themeMode === opt.key ? colors.primary + "15" : colors.surface,
                  marginBottom: 8, opacity: pressed ? 0.85 : 1,
                  borderWidth: themeMode === opt.key ? 1.5 : 0,
                  borderColor: themeMode === opt.key ? colors.primary : "transparent",
                })}
              >
                <IconSymbol name={opt.icon} size={20} color={themeMode === opt.key ? colors.primary : colors.muted} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: themeMode === opt.key ? colors.primary : colors.foreground, marginLeft: 12 }}>
                  {opt.label}
                </Text>
                {themeMode === opt.key && (
                  <View style={{ marginLeft: "auto" }}>
                    <IconSymbol name="checkmark" size={18} color={colors.primary} />
                  </View>
                )}
              </Pressable>
            ))}
            <Pressable onPress={() => setShowThemePicker(false)} style={{ marginTop: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Change PIN Modal */}
      <Modal visible={showChangePin} animationType="slide" transparent onRequestClose={() => setShowChangePin(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>{getPinTitle()}</Text>

            {/* PIN Dots */}
            <View style={{ flexDirection: "row", gap: 12, justifyContent: "center", marginBottom: 16 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: i < getCurrentPin().length ? colors.primary : colors.border,
                }} />
              ))}
            </View>

            {pinError ? <Text style={{ fontSize: 13, color: colors.error, textAlign: "center", marginBottom: 12 }}>{pinError}</Text> : null}

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
                        backgroundColor: pressed ? colors.border : "transparent",
                      })}
                    >
                      {key === "del" ? (
                        <IconSymbol name="xmark" size={20} color={colors.foreground} />
                      ) : key === "" ? null : (
                        <Text style={{ fontSize: 24, color: colors.foreground }}>{key}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            <Pressable onPress={() => setShowChangePin(false)} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
