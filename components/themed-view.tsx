import { View, type ViewProps } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface ThemedViewProps extends ViewProps {
  className?: string;
}

/**
 * A View component with automatic theme-aware background.
 * Uses NativeWind for styling - pass className for additional styles.
 */
export function ThemedView({ className, style, ...otherProps }: ThemedViewProps) {
  const colors = useColors();
  return (
    <View
      className={cn("bg-background", className)}
      style={[{ backgroundColor: colors.background }, style]}
      {...otherProps}
    />
  );
}
