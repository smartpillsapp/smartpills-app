// HangmanPatient
// Paciente con bata blanca y lunares azules, siempre completo.
// Solo cambia la expresión facial con cada fallo (stage 0 = sano; stage 6 = exitus).
import React from "react";
import Svg, {
  Defs, LinearGradient, Stop, Path, Circle, Ellipse, Rect, G, Line,
} from "react-native-svg";

const P = {
  skin:        "#f3d2b3",
  skinPale:    "#dfc4a8",
  skinDead:    "#bfc4be",
  skinShadow:  "#dab089",
  hair:        "#3d2f24",
  gown:        "#ffffff",
  gownShadow:  "#e3eef0",
  gownDot:     "#3b82f6",
  ink:         "#1c2b26",
  cheek:       "#f5a6a6",
};

// 7 caras (0-6). Coordenadas relativas a la cabeza centrada en (100, 70), radio 26.
function Face0() {
  // Sano, sonriente
  return (
    <G>
      <Ellipse cx={91} cy={68} rx={2.2} ry={3} fill={P.ink} />
      <Ellipse cx={109} cy={68} rx={2.2} ry={3} fill={P.ink} />
      <Path d="M91 80 Q100 87 109 80" stroke={P.ink} strokeWidth={2} fill="none" strokeLinecap="round"/>
    </G>
  );
}
function Face1() {
  // Sonrisa más leve
  return (
    <G>
      <Ellipse cx={91} cy={68} rx={2.2} ry={3} fill={P.ink} />
      <Ellipse cx={109} cy={68} rx={2.2} ry={3} fill={P.ink} />
      <Path d="M93 81 Q100 84 107 81" stroke={P.ink} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
    </G>
  );
}
function Face2() {
  // Neutral
  return (
    <G>
      <Ellipse cx={91} cy={68} rx={2.2} ry={3} fill={P.ink} />
      <Ellipse cx={109} cy={68} rx={2.2} ry={3} fill={P.ink} />
      <Path d="M93 82 L107 82" stroke={P.ink} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
    </G>
  );
}
function Face3() {
  // Preocupado (cejas inclinadas, boca recta)
  return (
    <G>
      <Path d="M86 64 L96 66" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round"/>
      <Path d="M104 66 L114 64" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round"/>
      <Ellipse cx={91} cy={69} rx={2.2} ry={3} fill={P.ink} />
      <Ellipse cx={109} cy={69} rx={2.2} ry={3} fill={P.ink} />
      <Path d="M93 83 L107 83" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round"/>
    </G>
  );
}
function Face4() {
  // Distress (cejas más inclinadas, boca hacia abajo)
  return (
    <G>
      <Path d="M86 64 L96 67" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round"/>
      <Path d="M104 67 L114 64" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round"/>
      <Ellipse cx={91} cy={70} rx={2.2} ry={3} fill={P.ink} />
      <Ellipse cx={109} cy={70} rx={2.2} ry={3} fill={P.ink} />
      <Path d="M93 85 Q100 80 107 85" stroke={P.ink} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
    </G>
  );
}
function Face5() {
  // Crítico (ojos cerrados, ceño marcado)
  return (
    <G>
      <Path d="M86 64 L96 67" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round"/>
      <Path d="M104 67 L114 64" stroke={P.ink} strokeWidth={1.5} strokeLinecap="round"/>
      <Path d="M87 70 L96 70" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M104 70 L113 70" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M93 85 Q100 79 107 85" stroke={P.ink} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
    </G>
  );
}
function Face6() {
  // Exitus (ojos en X, boca entreabierta)
  return (
    <G>
      <Path d="M88 66 L94 72 M94 66 L88 72" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M106 66 L112 72 M112 66 L106 72" stroke={P.ink} strokeWidth={1.8} strokeLinecap="round"/>
      <Ellipse cx={100} cy={84} rx={3.5} ry={2.2} fill={P.ink} />
    </G>
  );
}

// 6 caras (0-5). En stage 5 el paciente está exitus.
const FACES = [Face0, Face1, Face2, Face3, Face4, Face6];

export default function HangmanPatient({ stage = 0, width = 200, height = 240 }) {
  const safeStage = Math.min(Math.max(stage, 0), FACES.length - 1);
  const Face = FACES[safeStage];
  const isDead = safeStage >= 5;

  // Tono de piel: empalidece conforme empeora
  const skinTone = isDead ? P.skinDead
    : safeStage >= 3 ? P.skinPale
    : P.skin;

  return (
    <Svg width={width} height={height} viewBox="0 0 200 240">
      <Defs>
        <LinearGradient id="gownGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={P.gown} />
          <Stop offset="1" stopColor={P.gownShadow} />
        </LinearGradient>
      </Defs>

      {/* Suero (IV) — palo, bolsa, gotero y tubo a la mano izquierda */}
      <G>
        {/* Base con ruedas */}
        <Ellipse cx="20" cy="218" rx="14" ry="2.5" fill="#7a8285" />
        <Circle cx="10" cy="220" r="2.5" fill="#3a3f42" stroke="#1a1f22" strokeWidth="0.4" />
        <Circle cx="30" cy="220" r="2.5" fill="#3a3f42" stroke="#1a1f22" strokeWidth="0.4" />
        {/* Palo vertical */}
        <Line x1="20" y1="20" x2="20" y2="217" stroke="#b8bfc2" strokeWidth="2.2" strokeLinecap="round" />
        <Line x1="18.6" y1="22" x2="18.6" y2="210" stroke="#e0e6e8" strokeWidth="0.7" />
        {/* Gancho */}
        <Path d="M20 20 Q20 16 26 16" stroke="#b8bfc2" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Bolsa de suero */}
        <Path
          d="M14 28 L26 28 Q28 28 28 30 L28 56 Q28 60 26 60 L14 60 Q12 60 12 58 L12 30 Q12 28 14 28 Z"
          fill="#e8f5f7"
          stroke="#8aa8a5"
          strokeWidth="0.8"
        />
        {/* Líquido dentro de la bolsa */}
        <Path
          d="M14 38 L26 38 L26 56 Q26 58 25 58 L15 58 Q14 58 14 56 Z"
          fill="#a4d4e8"
          opacity="0.75"
        />
        {/* Etiqueta */}
        <Rect x="15" y="42" width="10" height="5" fill="#ffffff" opacity="0.6" rx="0.5" />
        {/* Cámara de goteo */}
        <Rect x="17" y="62" width="6" height="11" fill="#f5f9fa" stroke="#a8b0b3" strokeWidth="0.7" rx="1" />
        <Circle cx="20" cy="68" r="1" fill="#a4d4e8" />
        {/* Tubo desde el gotero hasta la mano izquierda */}
        <Path
          d="M20 73 Q20 120 28 145 Q40 165 56 167"
          stroke="#c4c8cb"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </G>

      {/* Pelo (detrás de la cabeza) */}
      <Path d="M75 55 Q80 36 100 36 Q120 36 125 55 L120 60 L80 60 Z" fill={P.hair} />

      {/* Cara */}
      <Circle cx="100" cy="70" r="26" fill={skinTone} stroke={P.skinShadow} strokeWidth="0.5"/>

      {/* Mejillas (se desvanecen al empeorar) */}
      <Circle cx="86" cy="78" r="3.5" fill={P.cheek} opacity={isDead ? 0.1 : Math.max(0.15, 0.6 - safeStage * 0.08)} />
      <Circle cx="114" cy="78" r="3.5" fill={P.cheek} opacity={isDead ? 0.1 : Math.max(0.15, 0.6 - safeStage * 0.08)} />

      {/* Expresión facial */}
      <Face />

      {/* Cuello */}
      <Rect x="92" y="92" width="16" height="14" fill={skinTone} />

      {/* Tronco (bata) */}
      <Path
        d="M68 110 Q75 100 100 100 Q125 100 132 110 L138 175 L62 175 Z"
        fill="url(#gownGrad)"
        stroke="#d5dee0"
        strokeWidth="1.2"
      />
      {/* Cuello en V */}
      <Path d="M92 100 L100 112 L108 100 Z" fill={P.skinShadow} opacity="0.6"/>
      {/* Lunares azules en la bata */}
      <Circle cx="80" cy="120" r="2.5" fill={P.gownDot} />
      <Circle cx="105" cy="115" r="2.5" fill={P.gownDot} />
      <Circle cx="92" cy="130" r="2.5" fill={P.gownDot} />
      <Circle cx="120" cy="128" r="2.5" fill={P.gownDot} />
      <Circle cx="75" cy="140" r="2.5" fill={P.gownDot} />
      <Circle cx="100" cy="145" r="2.5" fill={P.gownDot} />
      <Circle cx="125" cy="148" r="2.5" fill={P.gownDot} />
      <Circle cx="85" cy="158" r="2.5" fill={P.gownDot} />
      <Circle cx="115" cy="160" r="2.5" fill={P.gownDot} />
      <Circle cx="100" cy="168" r="2.5" fill={P.gownDot} />

      {/* Brazo izquierdo */}
      <Path
        d="M68 112 Q56 118 52 145 Q52 160 60 165"
        stroke={P.gown}
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="58" cy="167" r="7" fill={skinTone} stroke={P.skinShadow} strokeWidth="0.5"/>
      <Circle cx="56" cy="135" r="2.2" fill={P.gownDot} />
      <Circle cx="62" cy="152" r="2.2" fill={P.gownDot} />

      {/* Brazo derecho */}
      <Path
        d="M132 112 Q144 118 148 145 Q148 160 140 165"
        stroke={P.gown}
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="142" cy="167" r="7" fill={skinTone} stroke={P.skinShadow} strokeWidth="0.5"/>
      <Circle cx="144" cy="135" r="2.2" fill={P.gownDot} />
      <Circle cx="138" cy="152" r="2.2" fill={P.gownDot} />

      {/* Piernas */}
      <Rect x="76" y="175" width="20" height="40" fill={P.gown} stroke="#d5dee0" strokeWidth="1" rx="6"/>
      <Circle cx="84" cy="186" r="2" fill={P.gownDot}/>
      <Circle cx="88" cy="200" r="2" fill={P.gownDot}/>
      <Rect x="104" y="175" width="20" height="40" fill={P.gown} stroke="#d5dee0" strokeWidth="1" rx="6"/>
      <Circle cx="116" cy="186" r="2" fill={P.gownDot}/>
      <Circle cx="112" cy="200" r="2" fill={P.gownDot}/>

      {/* Pies */}
      <Ellipse cx="86" cy="220" rx="9" ry="4" fill={skinTone} stroke={P.skinShadow} strokeWidth="0.5"/>
      <Ellipse cx="114" cy="220" rx="9" ry="4" fill={skinTone} stroke={P.skinShadow} strokeWidth="0.5"/>

      {/* Apósito del suero (encima de la mano izquierda) */}
      <Rect x="53" y="164" width="9" height="4.5" fill="#ffffff" stroke="#cdd2d4" strokeWidth="0.4" rx="0.8"/>
      <Path d="M55 165.5 L57 167 M59 165.5 L61 167" stroke="#a8b0b3" strokeWidth="0.5" strokeLinecap="round"/>
    </Svg>
  );
}
