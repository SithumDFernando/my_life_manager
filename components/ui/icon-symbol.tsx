import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, string>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // Tab bar icons
  "dashboard": "dashboard",
  "event_note": "event_note",
  "folder_special": "folder_special",
  "bookmarks": "bookmarks",
  "more_horiz": "more_horiz",
  // Common icons
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "key.fill": "vpn-key",
  "person.fill": "person",
  "list.bullet": "list",
  "plus": "add",
  "minus": "remove",
  "xmark": "close",
  "checkmark": "check",
  "trash": "delete",
  "pencil": "edit",
  "eye": "visibility",
  "eye.slash": "visibility-off",
  "calendar": "calendar-today",
  "flag.fill": "flag",
  "map.pin": "place",
  "book.fill": "menu-book",
  "trophy.fill": "emoji-events",
  "link": "link",
  "search": "search",
  "gearshape.fill": "settings",
  "bell.fill": "notifications",
  "heart.fill": "favorite",
  "star.fill": "star",
  "star": "star-border",
  "clock.fill": "schedule",
  "tag.fill": "label",
  "photo.fill": "photo",
  "envelope.fill": "email",
  "globe": "public",
  "briefcase.fill": "work",
  "graduationcap.fill": "school",
  "chart.bar.fill": "bar-chart",
  "money.dollar.fill": "attach-money",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "doc.fill": "description",
  "doc.text.fill": "description",
  "square.grid.2x2": "grid-view",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "folder.fill": "folder",
  "square.and.arrow.up": "share",
  "paintbrush.fill": "brush",
  "textformat": "format-size",
  "doc.richtext": "article",
  "building.columns.fill": "account-balance",
  "creditcard.fill": "credit-card",
  "wifi": "wifi",
  "cloud.fill": "cloud",
  "server.rack": "storage",
  "cpu.fill": "memory",
  "sparkles": "auto-awesome",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "xmark.circle.fill": "cancel",
  "arrow.up.right": "open-in-new",
  "arrow.clockwise": "refresh",
  "doc.on.doc": "content-copy",
  "questionmark.circle.fill": "help-outline",
  "info.circle.fill": "info",
  "arrow.up.arrow.down": "sort",
  "square.grid.3x3.fill": "grid-3x3",
  "line.3.horizontal": "menu",
  "arrowtriangle.up.fill": "arrow-drop-up",
  "arrowtriangle.down.fill": "arrow-drop-down",
  "doc.plaintext": "notes",
  "paperclip": "attach-file",
  "hand.tap.fill": "touch-app",
  // Habits icons
  "bolt.fill": "flash-on",
  "shield.fill": "shield",
  "flame.fill": "local-fire-department",
  "chart.line.uptrend.xyaxis": "show-chart",
  "block": "block",
  "repeat": "repeat",
} as unknown as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] as any} style={style} />;
}
