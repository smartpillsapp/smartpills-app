import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

const C = {
  cream: "#f7f5f0",
};

export default function SplashAnimation({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in del logo
    Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Tras 3s con el logo, fade out y terminar
    const t = setTimeout(() => {
      Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        onFinish && onFinish();
      });
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex:1, backgroundColor:C.cream, alignItems:"center", justifyContent:"center" }}>
      <Animated.Image
        source={require("../assets/logo-smartpills.png")}
        style={{ width: 264, height: 264, opacity: logoOpacity }}
        resizeMode="contain"
      />
    </View>
  );
}
