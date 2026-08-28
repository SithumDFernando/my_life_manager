import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { CategoryPillSelector } from "@/components/ui/category-pill-selector";
import { showAlert } from "@/lib/alert";

const FEEDBACK_CATEGORIES = [
  { key: "Feature Request", label: "Feature Request", icon: "lightbulb.fill" },
  { key: "Bug Report", label: "Bug Report", icon: "ladybug.fill" },
  { key: "Review", label: "Review", icon: "star.fill" },
];

export default function DeveloperScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [category, setCategory] = useState("Feature Request");
  const [ratings, setRatings] = useState({
    ui: 4,
    speed: 5,
    features: 4,
    ease: 5,
  });
  const [comments, setComments] = useState("");
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const handleLink = async (url: string) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      showAlert("Error", "Could not open link.");
    }
  };

  const getDiagnosticsString = () => {
    return `App v2.0 | ${Platform.OS} | ${colors.primary ? "Theme Active" : "Unknown Theme"}`;
  };

  const generateFeedbackText = () => {
    const avg = (ratings.ui + ratings.speed + ratings.features + ratings.ease) / 4;
    return `👋 Hi Sithum!

*MyLife Manager Feedback [${category}]*

⭐ *Quality Ratings:*
• UI & Design: ${ratings.ui}/5 ⭐
• Speed & Performance: ${ratings.speed}/5 ⚡
• Features & Utility: ${ratings.features}/5 🎯
• Ease of Use: ${ratings.ease}/5 ✨
• Overall Score: ${avg.toFixed(1)} / 5.0

📝 *Comments:*
"${comments || "No comments provided."}"

${includeDiagnostics ? `📱 _Diagnostics: ${getDiagnosticsString()}_` : ""}
`;
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generateFeedbackText());
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert("Copied", "Feedback copied to clipboard!");
  };

  const sendEmail = () => {
    const body = encodeURIComponent(generateFeedbackText());
    const subject = encodeURIComponent(`MyLife Manager Feedback: ${category}`);
    handleLink(`mailto:sithumdf@gmail.com?subject=${subject}&body=${body}`);
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(generateFeedbackText());
    handleLink(`https://wa.me/94774348111?text=${text}`);
  };

  const RatingRow = ({ label, value, field, icon }: { label: string, value: number, field: keyof typeof ratings, icon: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <Text style={{ fontSize: 14, color: colors.foreground, width: 140 }}>
        {icon} {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Pressable
            key={num}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRatings(prev => ({ ...prev, [field]: num }));
            }}
            style={{ padding: 4 }}
          >
            <View style={{
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: num <= value ? colors.primary : colors.border
            }} />
          </Pressable>
        ))}
      </View>
      <Text style={{ fontSize: 13, color: colors.muted, width: 40, textAlign: "right", fontWeight: "600" }}>
        {value}/5
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>Developer & Feedback</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Developer Profile Card */}
        <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 20, borderWidth: 0.5, borderColor: colors.border, alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <IconSymbol name="person.crop.circle.fill" size={60} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>Sithum Fernando</Text>
          <Text style={{ fontSize: 14, color: colors.primary, marginTop: 4, fontWeight: "600", textAlign: "center" }}>
            Full-Stack & Mobile Software Engineer
          </Text>
          
          <View style={{ marginTop: 20, width: "100%", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol name="graduationcap.fill" size={16} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 10, flex: 1, lineHeight: 18 }}>
                B.S.E in Computer Science & Engineering at University of Moratuwa, Sri Lanka
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol name="envelope.fill" size={16} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 10 }}>sithumdf@gmail.com</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol name="phone.fill" size={16} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 10 }}>+94774348111</Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          <Pressable onPress={() => handleLink("https://github.com/sithumdfernando")} style={({ pressed }) => ({ flex: 1, minWidth: "45%", backgroundColor: colors.surface, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
            <IconSymbol name="link" size={16} color={colors.foreground} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginLeft: 8 }}>GitHub</Text>
          </Pressable>
          <Pressable onPress={() => handleLink("https://www.linkedin.com/in/sithum-fernando/")} style={({ pressed }) => ({ flex: 1, minWidth: "45%", backgroundColor: colors.surface, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
            <IconSymbol name="link" size={16} color={colors.foreground} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginLeft: 8 }}>LinkedIn</Text>
          </Pressable>
        </View>

        {/* Feedback Section */}
        <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.success + "15", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <IconSymbol name="bubble.left.and.bubble.right.fill" size={18} color={colors.success} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>App Feedback</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Help improve MyLife Manager</Text>
            </View>
          </View>
          
          <Pressable
            onPress={() => setShowFeedback(true)}
            style={({ pressed }) => ({
              backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center",
              opacity: pressed ? 0.7 : 1, marginTop: 8,
            })}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>Send Feedback</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <BottomSheetModal
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        title="Send Feedback"
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>Category</Text>
          <CategoryPillSelector 
            options={FEEDBACK_CATEGORIES}
            selected={category}
            onSelect={setCategory}
            scrollable={false}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Rate Your Experience</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
            <RatingRow label="UI & Design" icon="🎨" field="ui" value={ratings.ui} />
            <RatingRow label="Speed/Perf" icon="⚡" field="speed" value={ratings.speed} />
            <RatingRow label="Features" icon="🎯" field="features" value={ratings.features} />
            <RatingRow label="Ease of Use" icon="✨" field="ease" value={ratings.ease} />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>Comments</Text>
          <TextInput
            placeholder="I love the habit streak shields! Would also like a home screen widget..."
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
              fontSize: 14, color: colors.foreground, textAlignVertical: "top", minHeight: 100,
            }}
            placeholderTextColor={colors.muted}
          />
        </View>

        <Pressable 
          onPress={() => setIncludeDiagnostics(!includeDiagnostics)}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: includeDiagnostics ? colors.primary : colors.muted, backgroundColor: includeDiagnostics ? colors.primary : "transparent", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
            {includeDiagnostics && <IconSymbol name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={{ fontSize: 13, color: colors.muted }}>Include Diagnostics ({getDiagnosticsString()})</Text>
        </Pressable>

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Send via</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <Pressable onPress={sendWhatsApp} style={({ pressed }) => ({ flex: 1, minWidth: "48%", backgroundColor: "#25D366", borderRadius: 10, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
            <IconSymbol name="bubble.left.fill" size={16} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600", marginLeft: 8 }}>WhatsApp</Text>
          </Pressable>
          <Pressable onPress={sendEmail} style={({ pressed }) => ({ flex: 1, minWidth: "48%", backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", opacity: pressed ? 0.8 : 1 })}>
            <IconSymbol name="envelope.fill" size={16} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "600", marginLeft: 8 }}>Email</Text>
          </Pressable>
          <Pressable onPress={copyToClipboard} style={({ pressed }) => ({ width: "100%", backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", opacity: pressed ? 0.8 : 1, marginTop: 4 })}>
            <IconSymbol name="doc.on.doc" size={16} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600", marginLeft: 8 }}>Copy Formatted Text</Text>
          </Pressable>
        </View>

      </BottomSheetModal>
    </ScreenContainer>
  );
}
