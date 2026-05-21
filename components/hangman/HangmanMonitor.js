// HangmanMonitor
// Monitor de constantes vitales con onda ECG animada (efecto barrido).
// Usa el Animated estándar de React Native (no requiere config adicional).
// Recibe `vitals = { hr, sys, dia, spo2, label, color }` y `stage` (0-6).
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Path, Line, G } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

// Colores del monitor
const M = {
  bezel:        "#2c3a37",
  bezelDark:    "#1a2422",
  screen:       "#0a1a18",
  screenBorder: "#1e2c2a",
  gridLine:     "#143430",
  labelGreen:   "#5fbfa6",
};

// Genera path ECG repetible. Patrón: línea-pico-línea durante TILE pixels.
const TILE = 60;
const ECG_WIDTH = 200;
const ECG_HEIGHT = 36;
const BASELINE = ECG_HEIGHT / 2 + 1;

function buildBeatPath(amp = 1, flat = false) {
  if (flat) {
    return `M 0 ${BASELINE} L ${TILE} ${BASELINE}`;
  }
  const a = amp;
  return [
    `M 0 ${BASELINE}`,
    `L 10 ${BASELINE}`,
    `Q 13 ${BASELINE - 3 * a} 16 ${BASELINE}`,
    `L 22 ${BASELINE}`,
    `L 24 ${BASELINE + 3 * a}`,
    `L 27 ${BASELINE - 14 * a}`,
    `L 30 ${BASELINE + 5 * a}`,
    `L 33 ${BASELINE}`,
    `L 40 ${BASELINE}`,
    `Q 44 ${BASELINE - 4 * a} 48 ${BASELINE}`,
    `L ${TILE} ${BASELINE}`,
  ].join(" ");
}

function buildLoopPath(amp, flat) {
  const single = buildBeatPath(amp, flat);
  let acc = "";
  for (let i = 0; i < 5; i++) {
    const ox = i * TILE;
    acc += single.replace(/([MLQ])\s*([\d.-]+)\s+([\d.-]+)/g, (_, cmd, x, y) => {
      return `${cmd} ${parseFloat(x) + ox} ${y}`;
    });
    acc += " ";
  }
  return acc;
}

export default function HangmanMonitor({ vitals, stage = 0, width = 150 }) {
  const { hr, sys, dia, spo2, label, color } = vitals;
  const isDead = stage >= 5;

  const amp = isDead ? 0 : Math.max(0.35, 1 - stage * 0.18);
  // Duración de un ciclo completo del barrido (más fallos → más lento)
  const cycleMs = isDead ? 0 : Math.max(2500, 1800 + stage * 700);
  const path = buildLoopPath(amp, isDead);

  // Animación: translateX de -TILE a 0 (parece que la onda avanza)
  const translateX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isDead) {
      translateX.stopAnimation();
      translateX.setValue(0);
      return;
    }
    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -TILE,
        duration: cycleMs / 5, // un TILE por ciclo de duración
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [stage, cycleMs, isDead]);

  return (
    <View style={{ width, alignItems: "center" }}>
      <View style={{
        width, padding: 7, borderRadius: 12,
        backgroundColor: M.bezel,
        borderWidth: 2, borderColor: M.bezelDark,
        shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6,
        elevation: 4,
      }}>
        <View style={{
          backgroundColor: M.screen,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: M.screenBorder,
          paddingVertical: 6,
          paddingHorizontal: 6,
        }}>

          {/* Scope ECG */}
          <View style={{ height: ECG_HEIGHT, marginBottom: 4, overflow: "hidden" }}>
            <Svg width={ECG_WIDTH} height={ECG_HEIGHT}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <Line key={i}
                  x1={i * (ECG_WIDTH / 5)} y1={0}
                  x2={i * (ECG_WIDTH / 5)} y2={ECG_HEIGHT}
                  stroke={M.gridLine} strokeWidth={0.5}
                />
              ))}
              <Line x1={0} y1={BASELINE} x2={ECG_WIDTH} y2={BASELINE} stroke={M.gridLine} strokeWidth={0.5} strokeDasharray="2 3"/>

              <AnimatedG style={{ transform: [{ translateX }] }}>
                <Path
                  d={path}
                  stroke={color}
                  strokeWidth={1.6}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </AnimatedG>
            </Svg>
          </View>

          {/* FC */}
          <View style={S.row}>
            <Text style={[S.label, { color: M.labelGreen }]}>FC</Text>
            <Text style={[S.value, { color }]}>{hr}</Text>
            <Text style={S.unit}>bpm</Text>
          </View>
          {/* TA */}
          <View style={S.row}>
            <Text style={[S.label, { color: "#e0a85c" }]}>TA</Text>
            <Text style={[S.value, { color }]}>{sys}/{dia}</Text>
            <Text style={S.unit}>mmHg</Text>
          </View>
          {/* SpO2 */}
          <View style={S.row}>
            <Text style={[S.label, { color: "#85d2e0" }]}>SpO₂</Text>
            <Text style={[S.value, { color }]}>{spo2}</Text>
            <Text style={S.unit}>%</Text>
          </View>

          {/* Estado */}
          <View style={[S.statusRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: M.screenBorder }]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginRight: 5 }}/>
            <Text style={[S.statusText, { color }]}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const S = {
  row: { flexDirection: "row", alignItems: "baseline", marginBottom: 3 },
  label: { fontSize: 9, fontWeight: "700", width: 30, letterSpacing: 1 },
  value: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5, fontVariant: ["tabular-nums"] },
  unit:  { fontSize: 8, color: "#6a7a76", marginLeft: 4 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusText: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
};
