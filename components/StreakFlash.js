import { useEffect, useRef, useState } from "react";
import { Text, Image, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const IMAGE = "https://utzwotmcocrrkldhcknd.supabase.co/storage/v1/object/public/assets/Pildo%20racha.png";

const MESSAGES = [
  "¡Racha renovada! Sigue así y seguro que te ascienden.",
  "¡Incansable! Tienes más constancia que tu alarma los lunes por la mañana.",
  "¡Sigues en racha! Estás intratable. A este ritmo vas a tener que añadir tu racha de la app directamente al currículum.",
  "¡Racha renovada! Tu constancia es legendaria. Ni el mismísimo jefe de servicio se atrevería a interrumpirte ahora.",
  "Wow, tu racha está más limpia que la casaca de la supervisora.",
];

const C = {
  teal800:  "#0f3d35",
  amber500: "#d97706", // naranja, mismo que el apartado de tests
};

const STREAK_PHASE_MS = 2000; // tras esto aparece la imagen + mensaje
const MIN_DISMISS_MS  = 4000; // total mínimo antes de permitir tap-cerrar

export default function StreakFlash({ streak, onDismiss }) {
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  const streakOpacity  = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    // Fase 1: streak aparece de inmediato (fade-in)
    Animated.timing(streakOpacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    // Fase 2: imagen + mensaje aparecen tras 2s
    const messageTimer = setTimeout(() => {
      Animated.timing(messageOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    }, STREAK_PHASE_MS);

    // Permitir cerrar tras 4s (suma 2s racha + 2s mensaje)
    const dismissTimer = setTimeout(() => setCanDismiss(true), MIN_DISMISS_MS);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  function handleTap() {
    if (canDismiss) onDismiss();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.teal800 }} edges={["top","bottom"]}>
      <StatusBar style="light"/>
      <Pressable onPress={handleTap}
        style={{ flex: 1, paddingHorizontal: 32, paddingVertical: 40, justifyContent: "space-between" }}>

        {/* Parte superior — número de racha + label, todo en naranja */}
        <Animated.View style={{ opacity: streakOpacity, alignItems: "center", marginTop: 30 }}>
          <Text style={{
            fontFamily: "Georgia", fontSize: 96, color: C.amber500,
            lineHeight: 110, textAlign: "center",
          }}>
            {streak ?? 0}
          </Text>
          <Text style={{
            fontFamily: "Georgia", fontSize: 18, color: C.amber500,
            marginTop: 4,
          }}>
            Días de racha
          </Text>
        </Animated.View>

        {/* Parte inferior — imagen Pildo racha + mensaje aleatorio (subido hacia el centro) */}
        <Animated.View style={{ opacity: messageOpacity, alignItems: "center", marginBottom: 110 }}>
          <Image source={{ uri: IMAGE }}
            style={{ width: 180, height: 180, marginBottom: 18 }}
            resizeMode="contain"/>
          <Text style={{
            fontFamily: "Georgia", fontSize: 17, lineHeight: 24,
            color: "white", textAlign: "center", maxWidth: 320,
          }}>
            {message}
          </Text>
          <Text style={{
            fontSize: 11, color: "rgba(255,255,255,0.45)",
            marginTop: 18, opacity: canDismiss ? 1 : 0,
          }}>
            Toca la pantalla para continuar
          </Text>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}
