import { Alert, Platform } from "react-native";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  const fullMessage = message ? `${title}\n\n${message}` : title;

  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      // Find destructive or primary action
      const confirmAction = buttons.find(
        (b) => b.style === "destructive" || b.text.toLowerCase() === "delete" || b.text.toLowerCase() === "ok"
      );
      const cancelAction = buttons.find((b) => b.style === "cancel");

      const ok = window.confirm(fullMessage);
      if (ok) {
        confirmAction?.onPress?.();
      } else {
        cancelAction?.onPress?.();
      }
    } else {
      window.alert(fullMessage);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons as any);
  }
}
