import { useEffect, useRef, useState } from "react";
import { Text, Image, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const C = { teal800: "#0f3d35" };
const DEFAULT_MIN_MS = 4000;

// Flash genérico de pantalla completa con imagen + mensaje aleatorio.
// Solo se puede cerrar tras `minDurationMs` y tocando la pantalla.
export default function FullScreenFlash({ image, messages, minDurationMs = DEFAULT_MIN_MS, onDismiss }) {
  const [message] = useState(() =>
    messages && messages.length > 0
      ? messages[Math.floor(Math.random() * messages.length)]
      : ""
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
    const t = setTimeout(() => setCanDismiss(true), minDurationMs);
    return () => clearTimeout(t);
  }, []);

  function handleTap() {
    if (canDismiss) onDismiss();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.teal800 }} edges={["top","bottom"]}>
      <StatusBar style="light"/>
      <Pressable onPress={handleTap}
        style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Animated.View style={{ opacity, alignItems: "center" }}>
          <Image source={{ uri: image }}
            style={{ width: 240, height: 240, marginBottom: 28 }}
            resizeMode="contain"/>
          <Text style={{
            fontFamily: "Georgia", fontSize: 19, lineHeight: 27,
            color: "white", textAlign: "center", maxWidth: 340,
          }}>
            {message}
          </Text>
          <Text style={{
            fontSize: 12, color: "rgba(255,255,255,0.45)",
            marginTop: 32, opacity: canDismiss ? 1 : 0,
          }}>
            Toca la pantalla para continuar
          </Text>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}
