import { useState, useRef, useMemo, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable,
  PanResponder, Dimensions, ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

// ── Configuración ─────────────────────────────────────────────────────
const ROWS = 12;
const COLS = 10;
const WORDS_PER_PUZZLE = 11;

const DIRECTIONS = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

// Paleta SmartPills
const C = {
  teal800:    "#0f3d35",
  teal700:    "#155c50",
  teal600:    "#1a7a69",
  teal300:    "#6dcfc0",
  teal100:    "#d4f0eb",
  teal50:     "#edf8f6",
  coral500:   "#d4522a",
  coral300:   "#e8967e",
  coral100:   "#fae8e2",
  coral50:    "#fdf4f1",
  amber500:   "#d97706",
  sand:       "#efe3cf",    // arena de fondo
  sandLight:  "#f7eedd",    // tablero
  ink:        "#1c2b26",
  white:      "#ffffff",
  inkSoft:    "#607068",
};

// Tinte para palabras encontradas (alterna verde y coral, suaves)
const tintFor = (idx) => idx % 2 === 0
  ? "rgba(26,122,105,0.28)"    // teal600 28%
  : "rgba(212,82,42,0.22)";    // coral500 22%

// ── Geometría ──────────────────────────────────────────────────────────
function cellsBetween(a, b) {
  if (!a || !b) return [];
  if (a[0] === b[0] && a[1] === b[1]) return [a];

  const [r1, c1] = a, [r2, c2] = b;
  const dr = r2 - r1, dc = c2 - c1;
  const absDr = Math.abs(dr), absDc = Math.abs(dc);

  let stepR, stepC, steps;
  if (absDr < absDc * 0.4) {
    stepR = 0; stepC = Math.sign(dc); steps = absDc;
  } else if (absDc < absDr * 0.4) {
    stepR = Math.sign(dr); stepC = 0; steps = absDr;
  } else {
    stepR = Math.sign(dr); stepC = Math.sign(dc);
    steps = Math.max(absDr, absDc);
  }

  const out = [];
  for (let i = 0; i <= steps; i++) {
    const nr = r1 + stepR * i;
    const nc = c1 + stepC * i;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
    out.push([nr, nc]);
  }
  return out;
}
const cellKey = (r, c) => `${r}-${c}`;
const sameSet = (a, b) => {
  if (a.length !== b.length) return false;
  const sa = new Set(a.map(([r, c]) => cellKey(r, c)));
  return b.every(([r, c]) => sa.has(cellKey(r, c)));
};

// ── Generador ──────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(words) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const placements = [];
  const sorted = [...words].sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    if (word.length > Math.max(ROWS, COLS)) continue;
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const len = word.length;
      const minR = dr === -1 ? len - 1 : 0;
      const maxR = dr === 1 ? ROWS - len : ROWS - 1;
      const minC = dc === -1 ? len - 1 : 0;
      const maxC = dc === 1 ? COLS - len : COLS - 1;
      if (minR > maxR || minC > maxC) continue;

      const r = minR + Math.floor(Math.random() * (maxR - minR + 1));
      const c = minC + Math.floor(Math.random() * (maxC - minC + 1));

      const cells = [];
      let fits = true;
      for (let i = 0; i < len; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (grid[nr][nc] !== null && grid[nr][nc] !== word[i]) { fits = false; break; }
        cells.push([nr, nc]);
      }
      if (fits) {
        for (let i = 0; i < len; i++) {
          const [nr, nc] = cells[i];
          grid[nr][nc] = word[i];
        }
        placements.push({ word, cells });
        placed = true;
      }
    }
  }

  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) grid[r][c] = ABC[Math.floor(Math.random() * ABC.length)];
    }
  }
  return { grid, placements };
}

// Selecciona 11 palabras con MIX equilibrado por longitud para que haya variedad
// de direcciones (las muy largas solo caben vertical; las cortas y medias caben
// en cualquier dirección).
function pickBalancedWords(allWords) {
  const short  = allWords.filter(w => w.length <= 5);                       // 3-5 letras
  const medium = allWords.filter(w => w.length >= 6 && w.length <= 7);     // 6-7 letras
  const long   = allWords.filter(w => w.length >= 8 && w.length <= 9);     // 8-9 letras
  const xlong  = allWords.filter(w => w.length >= 10);                      // 10+ letras

  // Cuotas: 4 cortas + 3 medias + 2 largas + 2 extra-largas = 11
  const selected = [
    ...shuffle(short).slice(0, 4),
    ...shuffle(medium).slice(0, 3),
    ...shuffle(long).slice(0, 2),
    ...shuffle(xlong).slice(0, 2),
  ];

  // Si alguna categoría no tenía suficiente, completar con cualquier otra
  if (selected.length < WORDS_PER_PUZZLE) {
    const set = new Set(selected);
    const rest = shuffle(allWords).filter(w => !set.has(w));
    while (selected.length < WORDS_PER_PUZZLE && rest.length) {
      selected.push(rest.pop());
    }
  }
  return selected.slice(0, WORDS_PER_PUZZLE);
}

function buildPuzzle(allWords) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const selected = pickBalancedWords(allWords);
    const { grid, placements } = generateGrid(selected);
    if (placements.length >= WORDS_PER_PUZZLE - 1) return { grid, placements };
  }
  return generateGrid(pickBalancedWords(allWords));
}

// ── Dimensiones (sin scroll, tablero adaptativo) ──────────────────────
const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

// Reservar para top (~70) + panel palabras (~190) + safe areas (~50)
const RESERVED = 310;
const AVAILABLE_W = SCREEN_W - 24;
const AVAILABLE_H = SCREEN_H - RESERVED;
const CELL_W = Math.floor(Math.min(AVAILABLE_W / COLS, AVAILABLE_H / ROWS));
const BOARD_PAD = 8;

// ──────────────────────────────────────────────────────────────────────
export default function SopaLetras() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [puzzle, setPuzzle]   = useState(null);
  const [startCell, setStartCell] = useState(null);
  const [endCell, setEndCell]     = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [foundWords, setFoundWords] = useState([]);

  const startRef = useRef(null);
  const endRef   = useRef(null);
  const foundRef = useRef([]);
  foundRef.current = foundWords;
  const xpAwardedRef = useRef(false);
  // El PanResponder se crea solo una vez (closure captura estado inicial).
  // Para que handleEnd vea el puzzle CARGADO, usamos una ref que siempre apunta al actual.
  const puzzleRef = useRef(null);
  puzzleRef.current = puzzle;

  // Posición del tablero en pantalla — para convertir touches en celdas
  const boardRef = useRef(null);
  const boardPos = useRef({ x: 0, y: 0 });

  // ── Carga inicial ────────────────────────────────────────────────────
  useEffect(() => { loadAndGenerate(); }, []);
  useEffect(() => {
    if (puzzle) {
      const t = setTimeout(measureBoard, 120);
      return () => clearTimeout(t);
    }
  }, [puzzle]);

  const isComplete = puzzle && foundWords.length === puzzle.placements.length;

  useEffect(() => {
    if(isComplete && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      grantWinXp();
    }
  }, [isComplete]);

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
      console.warn("Sopa XP error:", err);
    }
  }

  async function loadAndGenerate() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("game_words")
        .select("word")
        .eq("is_active", true);
      const words = (data || [])
        .map(w => w.word.toUpperCase())
        .filter(w => w.length <= Math.max(ROWS, COLS));
      if (words.length < WORDS_PER_PUZZLE) {
        setPuzzle(buildPuzzle([
          "PACIENTE","MEDICINA","HOSPITAL","RECETA","SINTOMA","URGENCIA",
          "ENFERMERA","JERINGA","VENDAJE","VACUNA","SUERO",
        ]));
      } else {
        setPuzzle(buildPuzzle(words));
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFoundWords([]);
    setStartCell(null); setEndCell(null);
    setDragging(false);
    startRef.current = null; endRef.current = null;
    xpAwardedRef.current = false;
    loadAndGenerate();
  }

  // ── Detección de celda desde toque ──────────────────────────────────
  const measureBoard = () => {
    boardRef.current?.measureInWindow?.((x, y) => {
      boardPos.current = { x, y };
    });
  };

  const getCellFromTouch = (pageX, pageY) => {
    const localX = pageX - boardPos.current.x - BOARD_PAD;
    const localY = pageY - boardPos.current.y - BOARD_PAD;
    const col = Math.floor(localX / CELL_W);
    const row = Math.floor(localY / CELL_W);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return [row, col];
  };

  // ── Fin del gesto: comprobar palabra ────────────────────────────────
  const handleEnd = () => {
    const sel = cellsBetween(startRef.current, endRef.current);
    const currentPuzzle = puzzleRef.current; // ref, no closure stale
    if (sel.length >= 2 && currentPuzzle) {
      const idx = currentPuzzle.placements.findIndex(w => sameSet(w.cells, sel));
      if (idx >= 0 && !foundRef.current.some(f => f.word === currentPuzzle.placements[idx].word)) {
        setFoundWords(prev => [...prev, { ...currentPuzzle.placements[idx], colorIdx: idx }]);
      }
    }
    startRef.current = null; endRef.current = null;
    setStartCell(null); setEndCell(null);
    setDragging(false);
  };

  // ── PanResponder ─────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        measureBoard();
        const cell = getCellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        startRef.current = cell; endRef.current = cell;
        setStartCell(cell); setEndCell(cell);
        setDragging(true);
      },
      onPanResponderMove: (evt) => {
        const cell = getCellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        endRef.current = cell;
        setEndCell(cell);
      },
      onPanResponderRelease: handleEnd,
      onPanResponderTerminate: handleEnd,
    })
  ).current;

  const currentSelection = useMemo(
    () => cellsBetween(startCell, endCell),
    [startCell, endCell]
  );

  // ── Estilo de "píldora" para palabra/selección ──────────────────────
  const highlightStyle = (cells) => {
    if (cells.length < 1) return null;
    const [r1, c1] = cells[0];
    const [r2, c2] = cells[cells.length - 1];
    const cx1 = c1 * CELL_W + CELL_W / 2;
    const cy1 = r1 * CELL_W + CELL_W / 2;
    const cx2 = c2 * CELL_W + CELL_W / 2;
    const cy2 = r2 * CELL_W + CELL_W / 2;
    const dx = cx2 - cx1, dy = cy2 - cy1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const length = dist + CELL_W * 0.85;
    const height = CELL_W * 0.85;
    const angle = cells.length > 1 ? (Math.atan2(dy, dx) * 180) / Math.PI : 0;
    return {
      position: "absolute",
      left: (cx1 + cx2) / 2 - length / 2,
      top: (cy1 + cy2) / 2 - height / 2,
      width: length,
      height,
      borderRadius: height / 2,
      transform: [{ rotate: `${angle}deg` }],
    };
  };

  // ── Render ───────────────────────────────────────────────────────────
  if (loading || !puzzle) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: C.teal800, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator size="large" color="white"/>
        <Text style={{ marginTop:12, color: "rgba(255,255,255,0.7)" }}>Generando sopa…</Text>
      </SafeAreaView>
    );
  }

  const allFound = foundWords.length === puzzle.placements.length;
  const boardW = CELL_W * COLS + BOARD_PAD * 2;
  const boardH = CELL_W * ROWS + BOARD_PAD * 2;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: C.teal800 }} edges={["top"]}>
      <StatusBar style="light"/>

      {/* ── TOP — verde teal de la app ─────────────────────────── */}
      <View style={styles.topZone}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        <Text style={styles.title}>
          Sopa de letras<Text style={{ color: C.coral500 }}>.</Text>
        </Text>
        <Pressable onPress={reset} style={styles.resetBtn}>
          <Text style={styles.resetText}>↻ Reiniciar</Text>
        </Pressable>
      </View>

      {/* ── TABLERO — fondo arena ───────────────────────────────── */}
      <View style={styles.boardZone}>
        <View
          ref={boardRef}
          onLayout={() => setTimeout(measureBoard, 100)}
          pointerEvents="box-only"
          {...panResponder.panHandlers}
          style={[styles.board, { width: boardW, height: boardH }]}>

          {/* Capa interior con padding ya descontado: NINGÚN hijo captura touches */}
          <View pointerEvents="none"
            style={{ position:"absolute", left: BOARD_PAD, top: BOARD_PAD, width: CELL_W * COLS, height: CELL_W * ROWS }}>

            {/* Sombreados de palabras encontradas (debajo de las letras) */}
            {foundWords.map(fw => {
              const st = highlightStyle(fw.cells);
              if (!st) return null;
              return <View key={fw.word} style={[st, { backgroundColor: tintFor(fw.colorIdx) }]}/>;
            })}

            {/* Sombreado de la selección en curso */}
            {dragging && currentSelection.length >= 1 && (() => {
              const st = highlightStyle(currentSelection);
              if (!st) return null;
              return (
                <View style={[st, {
                  backgroundColor: "rgba(26,122,105,0.18)",
                  borderWidth: 1.5,
                  borderColor: C.teal600,
                }]}/>
              );
            })()}

            {/* Letras */}
            {puzzle.grid.map((row, r) =>
              row.map((letter, c) => (
                <Text key={`${r}-${c}`}
                  style={{
                    position:"absolute",
                    left: c * CELL_W,
                    top: r * CELL_W,
                    width: CELL_W,
                    height: CELL_W,
                    textAlign:"center",
                    textAlignVertical:"center",
                    lineHeight: CELL_W,
                    fontSize: Math.max(13, CELL_W * 0.5),
                    fontWeight: "600",
                    color: C.ink,
                  }}>
                  {letter}
                </Text>
              ))
            )}
          </View>
        </View>
      </View>

      {/* ── PALABRAS A ENCONTRAR ──────────────────────────────── */}
      <View style={[styles.wordsZone, { paddingBottom: 14 + insets.bottom }]}>
        <View style={styles.wordsHeader}>
          <Text style={styles.wordsTitle}>
            {allFound ? "🎉 ¡Completado!" : "Palabras a encontrar"}
            {allFound && <Text style={styles.xpBadge}>  +3 XP</Text>}
          </Text>
          <Text style={styles.wordsTag}>
            {foundWords.length}/{puzzle.placements.length}
          </Text>
        </View>

        <View style={styles.chipsWrap}>
          {puzzle.placements.map((w, i) => {
            const found = foundWords.some(f => f.word === w.word);
            return (
              <View key={w.word}
                style={[styles.chip, found ? styles.chipFound : styles.chipUnfound]}>
                <Text style={[styles.chipText, found && styles.chipTextFound]}>
                  {w.word}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── TOP
  topZone: {
    backgroundColor: C.teal800,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  backText: {
    fontSize: 13,
    color: C.coral300,
    fontWeight: "700",
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 17,
    color: "white",
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 6,
  },
  resetBtn: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: C.coral500,
  },
  resetText: {
    fontSize: 12,
    color: "white",
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  // ── TABLERO
  boardZone: {
    flex: 1,
    backgroundColor: C.sand,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  board: {
    backgroundColor: C.sandLight,
    borderWidth: 1.5,
    borderColor: "rgba(15,61,53,0.18)",
    borderRadius: 14,
    shadowColor: C.teal800,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },

  // ── PALABRAS
  wordsZone: {
    backgroundColor: C.teal50,
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.teal100,
  },
  wordsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  wordsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.teal800,
  },
  xpBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: C.amber500,
  },
  wordsTag: {
    fontSize: 13,
    color: C.coral500,
    fontWeight: "700",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  chipUnfound: {
    backgroundColor: "white",
    borderColor: C.coral100,
  },
  chipFound: {
    backgroundColor: C.coral500,
    borderColor: C.coral500,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: C.ink,
  },
  chipTextFound: {
    color: "white",
    textDecorationLine: "line-through",
  },
});
