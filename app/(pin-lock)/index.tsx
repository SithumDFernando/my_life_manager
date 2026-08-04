import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { pinStorage, settings as settingsStorage } from "@/lib/storage";
import { useColors } from "@/hooks/use-colors";

export default function PinLockScreen() {
  const router = useRouter();
  const colors = useColors();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm" | "set">("enter");
  const [error, setError] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    checkPin();
  }, []);

  const checkPin = async () => {
    const hasExistingPin = await pinStorage.hasPin();
    setHasPin(hasExistingPin);
    if (!hasExistingPin) {
      setStep("set");
    }
  };

  const handleDigit = (digit: string) => {
    setError("");
    if (step === "enter" || step === "set") {
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 6) {
          if (step === "enter") {
            verifyPin(newPin);
          } else {
            setStep("confirm");
          }
        }
      }
    } else if (step === "confirm") {
      if (confirmPin.length < 6) {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 6) {
          if (pin === newConfirm) {
            savePin(newConfirm);
          } else {
            setError("PINs don't match. Try again.");
            setConfirmPin("");
            setShake(true);
            setTimeout(() => setShake(false), 500);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError("");
    if (step === "confirm") {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const verifyPin = async (enteredPin: string) => {
    const isValid = await pinStorage.verify(enteredPin);
    if (isValid) {
      await settingsStorage.save({ lastOpenDate: new Date().toISOString().split("T")[0] });
      router.replace("/(tabs)");
    } else {
      setError("Incorrect PIN. Try again.");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const savePin = async (newPin: string) => {
    await pinStorage.set(newPin);
    await settingsStorage.save({ pinSet: true, lastOpenDate: new Date().toISOString().split("T")[0] });
    router.replace("/(tabs)");
  };

  const getTitle = () => {
    if (step === "enter") return "Enter PIN";
    if (step === "set") return "Set Your PIN";
    return "Confirm PIN";
  };

  const getSubtitle = () => {
    if (step === "enter") return "Enter your 6-digit PIN to continue";
    if (step === "set") return "Choose a 6-digit PIN for your app";
    return "Enter the same PIN again to confirm";
  };

  const getCurrentPin = () => (step === "confirm" ? confirmPin : pin);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Icon */}
        <View style={{ marginBottom: 24, opacity: 0.6 }}>
          <IconSymbol name="lock.fill" size={48} color={colors.tint} />
        </View>

        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
          {getTitle()}
        </Text>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", marginBottom: 32 }}>
          {getSubtitle()}
        </Text>

        {/* PIN Dots */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 48 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: i < getCurrentPin().length ? colors.tint : colors.border,
              }}
            />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <Text style={{ fontSize: 14, color: colors.error, marginBottom: 16 }}>{error}</Text>
        ) : null}

        {/* Numpad */}
        <View style={{ width: "100%", maxWidth: 320 }}>
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["", "0", "del"],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: "row", justifyContent: "center", marginBottom: 16 }}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    if (key === "del") handleDelete();
                    else if (key !== "") handleDigit(key);
                  }}
                  style={({ pressed }) => ({
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    marginHorizontal: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? colors.border : "transparent",
                  })}
                >
                  {key === "del" ? (
                    <IconSymbol name="xmark" size={24} color={colors.text} />
                  ) : key === "" ? null : (
                    <Text style={{ fontSize: 28, fontWeight: "400", color: colors.text }}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
