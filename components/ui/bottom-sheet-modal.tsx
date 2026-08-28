import React from "react";
import { View, Modal, Pressable, KeyboardAvoidingView, ScrollView, Text, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: any;
  scrollable?: boolean;
}

export function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
  maxHeight = "85%",
  scrollable = false,
}: BottomSheetModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} 
          onPress={onClose}
        >
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: colors.background, 
              borderTopLeftRadius: 20, 
              borderTopRightRadius: 20, 
              paddingTop: 16, 
              paddingHorizontal: 20,
              paddingBottom: Platform.OS === "ios" ? 34 : 24,
              maxHeight: maxHeight || "85%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag handle */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
            </View>

            {/* Title */}
            {title && (
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 14 }}>
                {title}
              </Text>
            )}

            {/* Scrollable / Static Body */}
            {scrollable ? (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                style={{ flexShrink: 1 }}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={{ flexShrink: 1 }}>
                {children}
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
