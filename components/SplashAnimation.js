import { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";

const C = {
  cream:    "#f7f5f0",
  teal700:  "#155c50",
  teal500:  "#1d9e87",
};

export default function SplashAnimation({ onFinish }) {
  const [phase, setPhase] = useState("text"); // "text" | "logo"
  const textOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1) Fade in del texto
    Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // 2) Tras 2s visible, fade out del texto y pasar a la fase del logo
    const t1 = setTimeout(() => {
      Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setPhase("logo");
        // 3) Fade in del logo
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

        // 4) Tras 3s con el logo, fade out y terminar
        const t2 = setTimeout(() => {
          Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            onFinish && onFinish();
          });
        }, 3000);
        // Limpieza del segundo timer
        return () => clearTimeout(t2);
      });
    }, 2000 + 400); // 400ms del fade in + 2s visible

    return () => clearTimeout(t1);
  }, []);

  return (
    <View style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
      {phase === "text" ? (
        <Animated.View style={{ opacity: textOpacity, alignItems:"center", paddingHorizontal:24 }}>
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:C.teal700 }}>
            Bienvenido/a
          </Text>
          <Text style={{ fontFamily:"Georgia", fontSize:22, color:C.teal700, marginBottom:4 }}>
            a
          </Text>
          <Text style={{ fontFamily:"Georgia", fontSize:40, color:C.teal700 }}>
            Smart<Text style={{ color: C.teal500 }}>Pills</Text>
          </Text>
        </Animated.View>
      ) : (
        <Animated.Image
          source={require("../assets/logo-smartpills.png")}
          style={{ width: 220, height: 220, opacity: logoOpacity }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}
