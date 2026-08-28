import { Href, Link } from "expo-router";
import { Linking, Platform } from "react-native";
import { type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== "web") {
          event.preventDefault();
          try {
            await Linking.openURL(href as string);
          } catch (e) {
            console.error("Failed to open URL:", e);
          }
        }
      }}
    />
  );
}
