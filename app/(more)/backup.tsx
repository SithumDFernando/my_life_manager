import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Platform, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

const EXPORT_KEYS = [
  "@mylife_accounts",
  "@mylife_subscriptions",
  "@mylife_bio_data",
  "@mylife_notes",
  "@mylife_competitions",
  "@mylife_events",
  "@mylife_venues",
  "@mylife_tasks",
  "@mylife_daily_reports",
  "@mylife_reading_items",
  "@mylife_achievements",
  "@mylife_projects",
  "@mylife_settings",
];

export default function BackupScreen() {
  const router = useRouter();
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<string>("");
  const [showExport, setShowExport] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data: Record<string, any> = {};
      for (const key of EXPORT_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
      data["@mylife_pin"] = await AsyncStorage.getItem("@mylife_pin");
      const json = JSON.stringify(data, null, 2);
      setExportData(json);
      setShowExport(true);
      await Clipboard.setStringAsync(json);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Exported", "Backup data has been copied to your clipboard. Save it somewhere safe!");
    } catch (err) {
      Alert.alert("Error", "Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      const data = JSON.parse(importText);
      let count = 0;
      for (const key of Object.keys(data)) {
        if (key === "@mylife_pin" && data[key]) {
          await AsyncStorage.setItem(key, data[key]);
        } else if (EXPORT_KEYS.includes(key)) {
          await AsyncStorage.setItem(key, JSON.stringify(data[key]));
        }
        count++;
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Imported", `Successfully imported ${count} data sets. Please restart the app.`);
      setImportText("");
    } catch (err) {
      Alert.alert("Error", "Invalid JSON data. Please check the format.");
    } finally {
      setImporting(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setImportText(text);
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
          <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Backup & Restore</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Export Section */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E8EAED", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#5B8DEF15", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#5B8DEF" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>Export Backup</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>Save all your data as JSON</Text>
            </View>
          </View>
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => ({
              backgroundColor: "#5B8DEF", borderRadius: 10, paddingVertical: 12, alignItems: "center",
              opacity: pressed || exporting ? 0.7 : 1, marginTop: 8,
            })}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
              {exporting ? "Exporting..." : "Export Data"}
            </Text>
          </Pressable>
        </View>

        {/* Export Preview */}
        {showExport && exportData && (
          <View style={{ backgroundColor: "#F7F8FA", borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: "#34D399", fontWeight: "600", marginBottom: 6 }}>Data copied to clipboard!</Text>
            <Pressable
              onPress={() => Clipboard.setStringAsync(exportData)}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", opacity: pressed ? 0.7 : 1 })}
            >
              <IconSymbol name="doc.on.doc" size={14} color="#5B8DEF" />
              <Text style={{ fontSize: 12, color: "#5B8DEF", marginLeft: 4 }}>Tap to copy again</Text>
            </Pressable>
          </View>
        )}

        {/* Import Section */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E8EAED", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#34D39915", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <IconSymbol name="arrow.clockwise" size={18} color="#34D399" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>Import Backup</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>Restore from JSON backup</Text>
            </View>
          </View>
          <TextInput
            placeholder="Paste your JSON backup here..."
            value={importText}
            onChangeText={setImportText}
            multiline
            numberOfLines={6}
            style={{
              backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
              fontSize: 12, color: "#1A1A2E", textAlignVertical: "top", minHeight: 120, marginTop: 8,
              fontFamily: Platform.OS === "ios" ? "monospace" : "monospace",
            }}
            placeholderTextColor="#8B8FA3"
          />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Pressable
              onPress={handlePasteFromClipboard}
              style={({ pressed }) => ({
                flex: 1, backgroundColor: "#F7F8FA", borderRadius: 10, paddingVertical: 12, alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#5B8DEF", fontSize: 13, fontWeight: "600" }}>Paste from Clipboard</Text>
            </Pressable>
            <Pressable
              onPress={handleImport}
              disabled={importing || !importText.trim()}
              style={({ pressed }) => ({
                flex: 1, backgroundColor: "#34D399", borderRadius: 10, paddingVertical: 12, alignItems: "center",
                opacity: pressed || importing || !importText.trim() ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
                {importing ? "Importing..." : "Import"}
              </Text>
            </Pressable>
          </View>
          <Text style={{ fontSize: 11, color: "#8B8FA3", marginTop: 8 }}>
            Warning: Importing will replace all existing data.
          </Text>
        </View>

        {/* Data Summary */}
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: "#E8EAED" }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E", marginBottom: 10 }}>Data Categories</Text>
          {EXPORT_KEYS.map((key) => (
            <View key={key} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#5B8DEF", marginRight: 10 }} />
              <Text style={{ fontSize: 13, color: "#8B8FA3", flex: 1 }}>{key.replace("@mylife_", "").replace(/_/g, " ")}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
