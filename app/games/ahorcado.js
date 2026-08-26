// Juego del Ahorcado — tema hospital.
// Estructura modular: componentes HangmanPatient y HangmanMonitor en /components/hangman.
// Lógica de palabras en /components/hangman/words.js + tabla `hangman_words` (Supabase).
// 6 fallos máximos: cada uno dibuja una parte del paciente y empeora las constantes.
import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

import HangmanPatient from "../../components/hangman/HangmanPatient";
import HangmanMonitor from "../../components/hangman/HangmanMonitor";
import HospitalWindow from "../../components/hangman/HospitalWindow";
import { FALLBACK_WORDS } from "../../components/hangman/words";

// Paleta SmartPills
const C = {
  teal800:   "#0f3d35",
  teal700:   "#155c50",
  teal600:   "#1a7a69",
  teal500:   "#1d9e87",
  teal300:   "#6dcfc0",
  teal100:   "#d4f0eb",
  teal50:    "#edf8f6",
  coral500:  "#d4522a",
  coral300:  "#e8967e",
  coral100:  "#fae8e2",
  coral50:   "#fdf4f1",
  amber500:  "#d97706",
  sand:      "#efe3cf",
  sandLight: "#f7eedd",
  ink:       "#1c2b26",
  inkSoft:   "#607068",
  white:     "#ffffff",
  exitusRed: "#7a1a1a",
};

// 6 estados (0-5 fallos). Cada uno define cómo se ve el monitor.
const STAGES = [
  { hr: 100, sys: 120, dia: 70, spo2: 100, label: "Estable",    color: C.teal500   },
  { hr: 80,  sys: 110, dia: 60, spo2: 95,  label: "Estable",    color: C.teal500   },
  { hr: 60,  sys: 100, dia: 50, spo2: 90,  label: "Vigilancia", color: C.amber500  },
  { hr: 40,  sys: 80,  dia: 40, spo2: 80,  label: "Inestable",  color: C.amber500  },
  { hr: 20,  sys: 60,  dia: 30, spo2: 60,  label: "Crítico",    color: C.coral500  },
  { hr: 0,   sys: 0,   dia: 0,  spo2: 0,   label: "Exitus",     color: C.exitusRed },
];

const MAX_FAILS = 5;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Ahorcado() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [guessed, setGuessed] = useState([]);
  const [fails, setFails] = useState(0);
  const xpAwardedRef = useRef(false);

  useEffect(() => { loadNewGame(); }, []);

  async function loadNewGame() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("hangman_words")
        .select("word, hint")
        .eq("is_active", true);
      const pool = (data && data.length > 0) ? data : FALLBACK_WORDS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setWord(pick.word.toUpperCase());
      setHint(pick.hint);
      setGuessed([]);
      setFails(0);
      xpAwardedRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  async function grantWinXp() {
    const XP = 3;
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(!user) return;
      // add_xp_typed ya suma a total_xp Y a weekly_xp; NO añadir add_weekly_xp
      // o el ranking semanal saldría el doble.
      await supabase.rpc("add_xp_typed", {
        user_id: user.id, xp_delta: XP, test_type: "game",
      });
    } catch(err) {
      console.warn("Ahorcado XP error:", err);
    }
  }

  // Derivados del estado
  const stage = Math.min(fails, STAGES.length - 1);
  const vitals = STAGES[stage];
  const wordLetters = word.split("");
  const uniqueLetters = new Set(wordLetters);
  const correctGuessed = guessed.filter(l => uniqueLetters.has(l));
  const isWin  = uniqueLetters.size > 0 && correctGuessed.length === uniqueLetters.size;
  const isLose = fails >= MAX_FAILS;
  const gameOver = isWin || isLose;

  useEffect(() => {
    if(isWin && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      grantWinXp();
    }
  }, [isWin]);

  function handleLetter(letter) {
    if (gameOver || guessed.includes(letter)) return;
    setGuessed(prev => [...prev, letter]);
    if (!wordLetters.includes(letter)) setFails(f => f + 1);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: C.teal800, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color="white"/>
        <Text style={{ marginTop:12, color:"rgba(255,255,255,0.7)" }}>Preparando paciente…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* ── TOP ───────────────────────────────────────────────── */}
      <View style={styles.topZone}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        <Text style={styles.title}>
          El Ahorcado<Text style={{ color: C.coral500 }}>.</Text>
        </Text>
        <Pressable onPress={loadNewGame} style={styles.resetBtn}>
          <Text style={styles.resetText}>↻ Nueva</Text>
        </Pressable>
      </View>

      {/* ── ESCENA HOSPITAL (paciente + monitor en SVG) ─────── */}
      <View style={styles.sceneZone}>
        {/* Ventana con paisaje soleado (decorativa) */}
        <View style={styles.window} pointerEvents="none">
          <HospitalWindow width={88} height={72}/>
        </View>

        <HangmanMonitor vitals={vitals} stage={stage}/>
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <HangmanPatient stage={stage} width={260} height={300}/>
        </View>
      </View>

      {/* ── PISTA + PALABRA + TECLADO ──────────────────────── */}
      <View style={[styles.gameZone, { paddingBottom: 10 + insets.bottom }]}>
        <Text style={styles.hintLabel}>PISTA</Text>
        <Text style={styles.hintText} numberOfLines={2}>{hint}</Text>

        <View style={styles.wordRow}>
          {wordLetters.map((letter, i) => {
            const revealed = guessed.includes(letter) || gameOver;
            return (
              <View key={i} style={styles.letterSlot}>
                <Text style={[
                  styles.letterText,
                  isLose && !guessed.includes(letter) && styles.letterTextLose,
                ]}>
                  {revealed ? letter : ""}
                </Text>
                <View style={styles.letterUnderline}/>
              </View>
            );
          })}
        </View>

        {gameOver ? (
          <View style={[styles.gameOverBanner, isWin ? styles.bannerWin : styles.bannerLose]}>
            <Text style={styles.gameOverTitle}>
              {isWin ? "¡Bien hecho!" : "Paciente exitus"}
            </Text>
            <Text style={styles.gameOverWord}>{word}</Text>
            {isWin && (
              <Text style={styles.xpBadge}>+3 XP</Text>
            )}
            <Pressable onPress={loadNewGame} style={styles.playAgainBtn}>
              <Text style={styles.playAgainText}>↻ Otra palabra</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.keyboard}>
            {[ALPHABET.slice(0,9), ALPHABET.slice(9,18), ALPHABET.slice(18)].map((row, ri) => (
              <View key={ri} style={styles.keyboardRow}>
                {row.map(letter => {
                  const used = guessed.includes(letter);
                  const inWord = wordLetters.includes(letter);
                  return (
                    <Pressable key={letter}
                      onPress={() => handleLetter(letter)}
                      disabled={used}
                      style={[
                        styles.key,
                        used && (inWord ? styles.keyCorrect : styles.keyWrong),
                      ]}>
                      <Text style={[styles.keyText, used && styles.keyTextUsed]}>{letter}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // TOP
  topZone: {
    backgroundColor: C.teal800,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  backText: { fontSize: 13, color: C.coral300, fontWeight: "700" },
  title: { fontFamily:"Georgia", fontSize: 17, color: "white", fontWeight: "700", textAlign: "center", flex: 1, marginHorizontal: 6 },
  resetBtn: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: C.coral500 },
  resetText: { fontSize: 12, color: "white", fontWeight: "700", letterSpacing: 0.4 },

  // Escena (toma el espacio sobrante → arena visible entre monitor y panel)
  sceneZone: {
    flex: 1,
    backgroundColor: C.sand,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  // Ventana decorativa (esquina superior derecha de la escena)
  window: {
    position: "absolute",
    top: 10,
    right: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  // Game zone (pista + palabra + teclado) — auto-altura
  gameZone: {
    backgroundColor: C.teal50,
    paddingHorizontal: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.teal100,
  },
  hintLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: C.coral500,
    marginBottom: 6,
    textAlign: "center",
  },
  hintText: {
    fontSize: 16,
    color: C.ink,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 14,
    paddingHorizontal: 8,
    lineHeight: 22,
  },
  wordRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  letterSlot: { minWidth: 24, marginHorizontal: 3, alignItems: "center" },
  letterText: {
    fontFamily: "Georgia",
    fontSize: 28,
    fontWeight: "700",
    color: C.teal800,
    height: 32,
  },
  letterTextLose: { color: C.exitusRed },
  letterUnderline: { width: 24, height: 2.5, backgroundColor: C.teal600, marginTop: 3 },

  // Teclado más grande
  keyboard: { alignItems: "center" },
  keyboardRow: { flexDirection: "row", marginBottom: 7 },
  key: {
    width: 36, height: 46,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1, borderColor: C.teal100,
  },
  keyCorrect: { backgroundColor: C.teal500, borderColor: C.teal500 },
  keyWrong:   { backgroundColor: C.coral500, borderColor: C.coral500 },
  keyText: { fontSize: 17, fontWeight: "700", color: C.ink },
  keyTextUsed: { color: "white" },

  // Banner final
  gameOverBanner: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  bannerWin: { backgroundColor: C.teal600 },
  bannerLose: { backgroundColor: C.exitusRed },
  gameOverTitle: { fontFamily: "Georgia", fontSize: 18, fontWeight: "700", color: "white", marginBottom: 4 },
  gameOverWord: { fontSize: 22, fontWeight: "700", color: "white", letterSpacing: 3, marginBottom: 12 },
  xpBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: C.amber500,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  playAgainBtn: {
    backgroundColor: C.coral500,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  playAgainText: { fontSize: 13, fontWeight: "700", color: "white" },
});
