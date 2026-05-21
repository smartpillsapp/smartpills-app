// HospitalWindow
// Ventana decorativa con paisaje soleado (sol, nubes, colinas).
// Pensada para colocarse absolutamente en una esquina del escenario.
import React from "react";
import Svg, {
  Rect, Circle, Path, Line, Defs, LinearGradient, Stop, G,
} from "react-native-svg";

export default function HospitalWindow({ width = 88, height = 72 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 88 72">
      <Defs>
        <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7ec5ed" />
          <Stop offset="1" stopColor="#d4ecf7" />
        </LinearGradient>
        <LinearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8ec99c" />
          <Stop offset="1" stopColor="#5c9e7c" />
        </LinearGradient>
      </Defs>

      {/* Marco exterior */}
      <Rect x="0" y="0" width="88" height="66" fill="#5c4530" rx="2" />
      <Rect x="2" y="2" width="84" height="62" fill="#a3805c" rx="1" />

      {/* Cristal con cielo */}
      <Rect x="4" y="4" width="80" height="58" fill="url(#skyGrad)" />

      {/* Sol con halo */}
      <Circle cx="66" cy="18" r="9" fill="#fff2c4" opacity="0.55" />
      <Circle cx="66" cy="18" r="6.5" fill="#ffd66b" />
      <Circle cx="66" cy="18" r="4.5" fill="#ffe88f" />
      {/* Rayos */}
      <G stroke="#ffd66b" strokeWidth="1.4" strokeLinecap="round">
        <Line x1="66" y1="6" x2="66" y2="8.5" />
        <Line x1="66" y1="27.5" x2="66" y2="30" />
        <Line x1="54" y1="18" x2="56.5" y2="18" />
        <Line x1="75.5" y1="18" x2="78" y2="18" />
        <Line x1="58" y1="10" x2="60" y2="12" />
        <Line x1="72" y1="24" x2="74" y2="26" />
        <Line x1="74" y1="10" x2="72" y2="12" />
        <Line x1="60" y1="24" x2="58" y2="26" />
      </G>

      {/* Nubes */}
      <G fill="#ffffff" opacity="0.95">
        <Circle cx="14" cy="16" r="3.5" />
        <Circle cx="19" cy="14" r="4.5" />
        <Circle cx="25" cy="16" r="3.5" />
        <Circle cx="38" cy="11" r="3" />
        <Circle cx="43" cy="11" r="2.5" />
      </G>

      {/* Colinas lejanas */}
      <Path
        d="M4 46 Q14 36 28 42 Q42 49 56 40 Q70 33 84 42 L84 62 L4 62 Z"
        fill="url(#hillGrad)"
      />
      {/* Colinas cercanas */}
      <Path
        d="M4 52 Q18 45 36 51 Q56 57 84 49 L84 62 L4 62 Z"
        fill="#4d8c6a"
        opacity="0.9"
      />
      {/* Pinitos */}
      <G fill="#3a6f51">
        <Path d="M18 50 L21 44 L24 50 Z" />
        <Path d="M55 49 L58 42 L61 49 Z" />
      </G>

      {/* Cruz divisoria de la ventana */}
      <Line x1="44" y1="4" x2="44" y2="62" stroke="#5c4530" strokeWidth="2" />
      <Line x1="4" y1="33" x2="84" y2="33" stroke="#5c4530" strokeWidth="2" />

      {/* Repisa inferior */}
      <Rect x="-2" y="65" width="92" height="6" fill="#5c4530" rx="1" />
      <Rect x="-2" y="65" width="92" height="2" fill="#7a5c40" />
    </Svg>
  );
}
