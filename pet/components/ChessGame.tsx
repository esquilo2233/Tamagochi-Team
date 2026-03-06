"use client";

import React, { useMemo, useState } from "react";

type Color = "w" | "b";
type PieceType = "p" | "r" | "n" | "b" | "q" | "k";
type Piece = `${Color}${PieceType}`;
type Cell = Piece | null;
type Board = Cell[][];

type Move = {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
};

const PIECE_ICON: Record<Piece, string> = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
};

const PIECE_VALUE: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

function initialBoard(): Board {
  return [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
  ];
}

function inside(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function pieceColor(p: Cell): Color | null {
  return p ? (p[0] as Color) : null;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function findKing(board: Board, color: Color): { r: number; c: number } | null {
  const king = `${color}k` as Piece;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) return { r, c };
    }
  }
  return null;
}

function applyMove(board: Board, m: Move): Board {
  const next = cloneBoard(board);
  const piece = next[m.fromR][m.fromC];
  next[m.fromR][m.fromC] = null;
  next[m.toR][m.toC] = piece;

  // promoção simples para rainha
  if (piece === "wp" && m.toR === 0) next[m.toR][m.toC] = "wq";
  if (piece === "bp" && m.toR === 7) next[m.toR][m.toC] = "bq";

  return next;
}

function evaluate(board: Board) {
  let total = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      const val = PIECE_VALUE[p[1] as PieceType];
      total += p[0] === "w" ? val : -val;
    }
  }
  return total;
}

function hasKing(board: Board, color: Color) {
  const target: Piece = `${color}k`;
  return board.some((row) => row.some((p) => p === target));
}

function isSquareAttacked(
  board: Board,
  r: number,
  c: number,
  by: Color,
): boolean {
  // pawns
  const pawnDir = by === "w" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const pr = r - pawnDir;
    const pc = c - dc;
    if (!inside(pr, pc)) continue;
    const p = board[pr][pc];
    if (p === `${by}p`) return true;
  }

  // knights
  const knightJumps = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [dr, dc] of knightJumps) {
    const nr = r + dr;
    const nc = c + dc;
    if (!inside(nr, nc)) continue;
    if (board[nr][nc] === `${by}n`) return true;
  }

  // king
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(nr, nc)) continue;
      if (board[nr][nc] === `${by}k`) return true;
    }
  }

  // bishop/queen diagonals
  const diagonalDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [dr, dc] of diagonalDirs) {
    let nr = r + dr;
    let nc = c + dc;
    while (inside(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p[0] === by && (p[1] === "b" || p[1] === "q")) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // rook/queen lines
  const lineDirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of lineDirs) {
    let nr = r + dr;
    let nc = c + dc;
    while (inside(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p[0] === by && (p[1] === "r" || p[1] === "q")) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return false;
}

function isKingInCheck(board: Board, color: Color): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return true;
  const enemy: Color = color === "w" ? "b" : "w";
  return isSquareAttacked(board, kingPos.r, kingPos.c, enemy);
}

function pseudoMoves(board: Board, color: Color): Move[] {
  const out: Move[] = [];

  const pushLine = (fromR: number, fromC: number, dr: number, dc: number) => {
    let r = fromR + dr;
    let c = fromC + dc;
    while (inside(r, c)) {
      const t = board[r][c];
      if (!t) out.push({ fromR, fromC, toR: r, toC: c });
      else {
        if (pieceColor(t) !== color && t[1] !== "k")
          out.push({ fromR, fromC, toR: r, toC: c });
        break;
      }
      r += dr;
      c += dc;
    }
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p[0] !== color) continue;
      const type = p[1];

      if (type === "p") {
        const dir = color === "w" ? -1 : 1;
        const startRow = color === "w" ? 6 : 1;

        const fr = r + dir;
        if (inside(fr, c) && !board[fr][c])
          out.push({ fromR: r, fromC: c, toR: fr, toC: c });

        const fr2 = r + 2 * dir;
        if (
          r === startRow &&
          inside(fr2, c) &&
          !board[fr][c] &&
          !board[fr2][c]
        ) {
          out.push({ fromR: r, fromC: c, toR: fr2, toC: c });
        }

        for (const dc of [-1, 1]) {
          const cr = r + dir;
          const cc = c + dc;
          if (!inside(cr, cc)) continue;
          const t = board[cr][cc];
          if (t && pieceColor(t) !== color && t[1] !== "k")
            out.push({ fromR: r, fromC: c, toR: cr, toC: cc });
        }
      }

      if (type === "n") {
        const jumps = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const [dr, dc] of jumps) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inside(nr, nc)) continue;
          const t = board[nr][nc];
          if (!t || (pieceColor(t) !== color && t[1] !== "k"))
            out.push({ fromR: r, fromC: c, toR: nr, toC: nc });
        }
      }

      if (type === "b" || type === "q") {
        pushLine(r, c, -1, -1);
        pushLine(r, c, -1, 1);
        pushLine(r, c, 1, -1);
        pushLine(r, c, 1, 1);
      }
      if (type === "r" || type === "q") {
        pushLine(r, c, -1, 0);
        pushLine(r, c, 1, 0);
        pushLine(r, c, 0, -1);
        pushLine(r, c, 0, 1);
      }

      if (type === "k") {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (!inside(nr, nc)) continue;
            const t = board[nr][nc];
            if (!t || (pieceColor(t) !== color && t[1] !== "k"))
              out.push({ fromR: r, fromC: c, toR: nr, toC: nc });
          }
        }
      }
    }
  }

  return out;
}

function legalMoves(board: Board, color: Color): Move[] {
  const moves = pseudoMoves(board, color);
  return moves.filter((m) => {
    const next = applyMove(board, m);
    return !isKingInCheck(next, color);
  });
}

function gameResult(board: Board, turn: Color): "w" | "b" | "draw" | null {
  const whiteKing = hasKing(board, "w");
  const blackKing = hasKing(board, "b");
  if (!whiteKing) return "b";
  if (!blackKing) return "w";

  const moves = legalMoves(board, turn);
  if (moves.length === 0) {
    return isKingInCheck(board, turn) ? (turn === "w" ? "b" : "w") : "draw";
  }
  return null;
}

function moveQuality(board: Board, m: Move, cpuColor: Color) {
  const target = board[m.toR][m.toC];
  const capture = target ? PIECE_VALUE[target[1] as PieceType] : 0;
  const after = applyMove(board, m);
  const evalAfter = evaluate(after);
  const scoreFromCpuPerspective = cpuColor === "w" ? evalAfter : -evalAfter;
  return capture * 10 + scoreFromCpuPerspective;
}

export default function ChessGame({
  personId,
  onFinish,
}: {
  personId?: number;
  onFinish?: (score: number, coinsAwarded?: number) => void;
}) {
  const [board, setBoard] = useState<Board>(initialBoard());
  const [turn, setTurn] = useState<Color>("w");
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(
    null,
  );
  const [winner, setWinner] = useState<"w" | "b" | "draw" | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [mode, setMode] = useState<"cpu" | "local">("cpu");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [samuraiMovePending, setSamuraiMovePending] = useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsDarkMode(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const moves = useMemo(() => legalMoves(board, turn), [board, turn]);

  const selectedMoves = useMemo(() => {
    if (!selected) return [] as Move[];
    return moves.filter(
      (m) => m.fromR === selected.r && m.fromC === selected.c,
    );
  }, [selected, moves]);

  async function finishGame(result: "w" | "b" | "draw") {
    if (mode === "local") {
      onFinish?.(0, 0);
      return;
    }

    if (result === "draw") {
      onFinish?.(0, 0);
      return;
    }

    const humanWon = result === "w";
    const outcome = humanWon ? "win" : "lose";
    const score = humanWon ? 1 : 0; // score de registo; moedas vêm da configuração no backend

    if (!personId) {
      onFinish?.(score, 0);
      return;
    }

    setLoading(true);
    try {
      const payload = { game: "chess", score, personId, outcome };
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      onFinish?.(score, j?.coinsAwarded ?? 0);
    } catch {
      onFinish?.(score, 0);
    } finally {
      setLoading(false);
    }
  }

  function maybeEnd(nextBoard: Board, nextTurn: Color) {
    return gameResult(nextBoard, nextTurn);
  }

  function playMove(m: Move) {
    if (winner || (turn === "w" && samuraiMovePending)) return;
    const next = applyMove(board, m);
    const nextTurn: Color = turn === "w" ? "b" : "w";
    const result = maybeEnd(next, nextTurn);

    setBoard(next);
    setSelected(null);

    if (result) {
      setWinner(result);
      finishGame(result);
      return;
    }

    setTurn(nextTurn);
    if (nextTurn === "b" && mode === "cpu") {
      setSamuraiMovePending(true);
    }
  }

  function chooseCpuMove(nextBoard: Board, cpuColor: Color): Move | null {
    const cpuMoves = legalMoves(nextBoard, cpuColor);
    if (cpuMoves.length === 0) return null;
    const enemy: Color = cpuColor === "w" ? "b" : "w";

    if (difficulty === "easy") {
      return cpuMoves[Math.floor(Math.random() * cpuMoves.length)];
    }

    if (difficulty === "medium") {
      // Médio: avaliação 1-ply + evita pendurar peças valiosas
      const ranked = cpuMoves
        .map((m) => {
          const after = applyMove(nextBoard, m);
          const base = moveQuality(nextBoard, m, cpuColor);
          const oppMoves = legalMoves(after, enemy);
          const biggestThreat = oppMoves.reduce((max, om) => {
            const target = after[om.toR][om.toC];
            if (!target || target[0] !== cpuColor) return max;
            return Math.max(max, PIECE_VALUE[target[1] as PieceType]);
          }, 0);
          return { m, score: base - biggestThreat * 4 };
        })
        .sort((a, b) => b.score - a.score);

      const top = ranked.slice(0, Math.min(3, ranked.length));
      // Normalmente joga a melhor, mas mantém alguma variedade
      if (Math.random() < 0.75) return top[0].m;
      return top[Math.floor(Math.random() * top.length)].m;
    }

    // hard: minimax com alpha-beta (mais forte que 1-ply)
    const minimax = (
      b: Board,
      sideToMove: Color,
      depth: number,
      alpha: number,
      beta: number,
    ): number => {
      const result = gameResult(b, sideToMove);
      if (result) {
        if (result === "draw") return 0;
        return result === cpuColor ? 10000 + depth : -10000 - depth;
      }

      if (depth === 0) {
        const e = evaluate(b);
        return cpuColor === "w" ? e : -e;
      }

      const movesForSide = legalMoves(b, sideToMove);
      const maximizing = sideToMove === cpuColor;

      if (maximizing) {
        let bestVal = -Infinity;
        for (const m of movesForSide) {
          const nb = applyMove(b, m);
          const val = minimax(
            nb,
            sideToMove === "w" ? "b" : "w",
            depth - 1,
            alpha,
            beta,
          );
          bestVal = Math.max(bestVal, val);
          alpha = Math.max(alpha, bestVal);
          if (beta <= alpha) break;
        }
        return bestVal;
      }

      let bestVal = Infinity;
      for (const m of movesForSide) {
        const nb = applyMove(b, m);
        const val = minimax(
          nb,
          sideToMove === "w" ? "b" : "w",
          depth - 1,
          alpha,
          beta,
        );
        bestVal = Math.min(bestVal, val);
        beta = Math.min(beta, bestVal);
        if (beta <= alpha) break;
      }
      return bestVal;
    };

    let best = cpuMoves[0];
    let bestScore = -Infinity;
    for (const m of cpuMoves) {
      const nb = applyMove(nextBoard, m);
      const score = minimax(nb, enemy, 2, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
    return best;
  }

  React.useEffect(() => {
    if (mode !== "cpu" || winner || turn !== "b" || !samuraiMovePending) return;
    const timer = setTimeout(() => {
      const cpuMove = chooseCpuMove(board, "b");
      if (!cpuMove) {
        setWinner("draw");
        finishGame("draw");
        return;
      }
      playMove(cpuMove);
      setSamuraiMovePending(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [turn, board, winner, difficulty, mode, samuraiMovePending]);

  function onCellClick(r: number, c: number) {
    if (winner) return;
    if (mode === "cpu" && turn !== "w") return;
    const piece = board[r][c];

    if (selected) {
      const move = selectedMoves.find((m) => m.toR === r && m.toC === c);
      if (move) {
        playMove(move);
        return;
      }
    }

    if (piece && piece[0] === turn) {
      setSelected({ r, c });
    } else {
      setSelected(null);
    }
  }

  function reset() {
    setBoard(initialBoard());
    setTurn("w");
    setSelected(null);
    setWinner(null);
    setSamuraiMovePending(false);
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: "var(--card-bg)",
        color: "var(--foreground)",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0" }}>♟️ Xadrez vs Samurai</h4>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <label style={{ fontSize: 13, color: "var(--muted)" }}>Modo:</label>
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as "cpu" | "local");
            setBoard(initialBoard());
            setTurn("w");
            setSelected(null);
            setWinner(null);
          }}
          disabled={loading || !!winner}
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--card-border)",
            borderRadius: 6,
            padding: "4px 6px",
          }}
        >
          <option value="cpu">vs Samurai</option>
          <option value="local">2 jogadores (local)</option>
        </select>

        <label style={{ fontSize: 13, color: "var(--muted)" }}>
          Dificuldade:
        </label>
        <select
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as "easy" | "medium" | "hard")
          }
          disabled={mode !== "cpu" || turn !== "w" || loading || !!winner}
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--card-border)",
            borderRadius: 6,
            padding: "4px 6px",
          }}
        >
          <option value="easy">Fácil</option>
          <option value="medium">Médio</option>
          <option value="hard">Difícil</option>
        </select>
      </div>

      <div style={{ marginBottom: 8, color: "var(--muted)", fontSize: 13 }}>
        {winner
          ? winner === "draw"
            ? "Empate."
            : winner === "w"
              ? mode === "cpu"
                ? "Ganhaste ao Samurai!"
                : "Brancas venceram!"
              : mode === "cpu"
                ? "Samurai venceu."
                : "Pretas venceram!"
          : turn === "w"
            ? mode === "cpu"
              ? "A tua vez (brancas)."
              : "Vez das brancas."
            : mode === "cpu"
              ? "Vez do Samurai..."
              : "Vez das pretas."}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 40px)",
          gap: 0,
          border: "2px solid var(--card-border)",
          width: "fit-content",
          margin: "0 auto",
        }}
      >
        {board.map((row, r) =>
          row.map((p, c) => {
            const dark = (r + c) % 2 === 1;
            const isSelected = selected?.r === r && selected?.c === c;
            const isTarget = selectedMoves.some(
              (m) => m.toR === r && m.toC === c,
            );
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  border: "none",
                  fontSize: 25,
                  fontWeight: 700,
                  lineHeight: "40px",
                  textAlign: "center",
                  cursor: turn === "w" && !winner ? "pointer" : "default",
                  color: p
                    ? p[0] === "w"
                      ? isDarkMode
                        ? "#f8fafc"
                        : "#fffef8"
                      : isDarkMode
                        ? "#111827"
                        : "#111111"
                    : "transparent",
                  textShadow:
                    p?.[0] === "w"
                      ? "0 1px 0 rgba(0,0,0,0.95), 0 -1px 0 rgba(0,0,0,0.95), 1px 0 0 rgba(0,0,0,0.95), -1px 0 0 rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.65)"
                      : "0 0 1px rgba(255,255,255,0.35)",
                  background: isSelected
                    ? "#f59e0b"
                    : isTarget
                      ? "#22c55e"
                      : dark
                        ? isDarkMode
                          ? "#7c5a3f"
                          : "#b58863"
                        : isDarkMode
                          ? "#d9c7ab"
                          : "#f0d9b5",
                  boxShadow: isSelected
                    ? "inset 0 0 0 3px #fef3c7, 0 0 0 2px rgba(0,0,0,0.35)"
                    : isTarget
                      ? "inset 0 0 0 2px rgba(255,255,255,0.65)"
                      : "none",
                }}
              >
                {isTarget && !p && (
                  <span
                    style={{
                      position: "absolute",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.85)",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
                {isTarget && p && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 4,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.9)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                {p ? PIECE_ICON[p] : ""}
              </button>
            );
          }),
        )}
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <button
          onClick={reset}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Novo jogo
        </button>
      </div>
    </div>
  );
}
