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
  maxHeight,
  scrollable = false,
}: BottomSheetModalProps) {
  const colors = useColors();

  const content = (
    <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight }}>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
      </View>
      {title && (
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );

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
          <Pressable onPress={(e) => e.stopPropagation()}>
             {scrollable ? (
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} bounces={false} showsVerticalScrollIndicator={false}>
                  {content}
                </ScrollView>
             ) : (
                content
             )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
