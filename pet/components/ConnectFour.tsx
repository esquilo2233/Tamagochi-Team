"use client";

import React, { useEffect, useMemo, useState } from "react";

type Cell = "R" | "Y" | null;
type Winner = "R" | "Y" | "draw" | null;
type Difficulty = "easy" | "medium" | "hard";

const ROWS = 6;
const COLS = 7;

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function getDropRow(board: Cell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) return r;
  }
  return -1;
}

function checkWinner(board: Cell[][]): Winner {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      for (const [dr, dc] of dirs) {
        let ok = true;
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (
            nr < 0 ||
            nr >= ROWS ||
            nc < 0 ||
            nc >= COLS ||
            board[nr][nc] !== cell
          ) {
            ok = false;
            break;
          }
        }
        if (ok) return cell;
      }
    }
  }

  if (board.every((row) => row.every((x) => x))) return "draw";
  return null;
}

function aiMove(board: Cell[][], difficulty: Difficulty): number {
  const legalCols = Array.from({ length: COLS }, (_, c) => c).filter(
    (c) => getDropRow(board, c) !== -1,
  );
  if (!legalCols.length) return -1;

  // Ganhar já
  for (const c of legalCols) {
    const r = getDropRow(board, c);
    const test = board.map((row) => [...row]);
    test[r][c] = "Y";
    if (checkWinner(test) === "Y") return c;
  }

  // Bloquear jogador
  for (const c of legalCols) {
    const r = getDropRow(board, c);
    const test = board.map((row) => [...row]);
    test[r][c] = "R";
    if (checkWinner(test) === "R") return c;
  }

  // Fácil: aleatório
  if (difficulty === "easy") {
    return legalCols[Math.floor(Math.random() * legalCols.length)];
  }

  // Médio: criar ameaças duplas
  if (difficulty === "medium") {
    for (const c of legalCols) {
      const r = getDropRow(board, c);
      const test = board.map((row) => [...row]);
      test[r][c] = "Y";
      let threatCount = 0;
      for (const nextCol of legalCols) {
        if (nextCol === c) continue;
        const nextRow = getDropRow(test, nextCol);
        if (nextRow === -1) continue;
        const nextTest = test.map((row) => [...row]);
        nextTest[nextRow][nextCol] = "Y";
        if (checkWinner(nextTest) === "Y") threatCount++;
      }
      if (threatCount >= 2) return c;
    }
  }

  // Difícil: bloquear ameaças duplas + centro
  if (difficulty === "hard") {
    for (const c of legalCols) {
      const r = getDropRow(board, c);
      const test = board.map((row) => [...row]);
      test[r][c] = "R";
      let threatCount = 0;
      for (const nextCol of legalCols) {
        if (nextCol === c) continue;
        const nextRow = getDropRow(test, nextCol);
        if (nextRow === -1) continue;
        const nextTest = test.map((row) => [...row]);
        nextTest[nextRow][nextCol] = "R";
        if (checkWinner(nextTest) === "R") threatCount++;
      }
      if (threatCount >= 2) return c;
    }
  }

  // Centro preferido com pesos
  const centerWeights: Record<number, number> = {
    3: 10,
    2: 7,
    4: 7,
    1: 3,
    5: 3,
    0: 1,
    6: 1,
  };
  const scoredCols = legalCols.map((c) => ({
    col: c,
    score: centerWeights[c] || 0,
  }));
  scoredCols.sort((a, b) => b.score - a.score);
  const topCols = scoredCols.slice(0, Math.min(2, scoredCols.length));
  return topCols[Math.floor(Math.random() * topCols.length)].col;
}

export default function ConnectFour({
  personId,
  onFinish,
}: {
  personId?: number;
  onFinish?: (winner: "player" | "samurai" | "draw", score: number) => void;
}) {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard());
  const [turn, setTurn] = useState<"R" | "Y">("R");
  const [winner, setWinner] = useState<Winner>(null);
  const [loading, setLoading] = useState(false);
  const [samuraiMovePending, setSamuraiMovePending] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const status = useMemo(() => {
    if (winner === "draw") return "🤝 Empate!";
    if (winner === "R") return "🎉 Ganhaste!";
    if (winner === "Y") return "🤖 Samurai venceu!";
    return turn === "R" ? "A tua vez (vermelho)" : "Vez do Samurai...";
  }, [winner, turn]);

  function play(col: number, piece: "R" | "Y") {
    if (winner || (piece === "R" && samuraiMovePending)) return;
    const row = getDropRow(board, col);
    if (row === -1) return;
    const next = board.map((r) => [...r]);
    next[row][col] = piece;
    const w = checkWinner(next);
    setBoard(next);

    if (w) {
      setWinner(w);
    } else {
      setTurn(piece === "R" ? "Y" : "R");
      if (piece === "R") {
        setSamuraiMovePending(true);
      }
    }
  }

  useEffect(() => {
    if (winner || turn !== "Y" || !samuraiMovePending) return;
    const c = aiMove(board, difficulty);
    if (c < 0) return;

    const t = setTimeout(
      () => {
        const row = getDropRow(board, c);
        if (row === -1) return;

        const next = board.map((r) => [...r]);
        next[row][c] = "Y";
        const w = checkWinner(next);
        setBoard(next);

        if (w) {
          setWinner(w);
        } else {
          setTurn("R");
        }

        setSamuraiMovePending(false);
      },
      difficulty === "easy" ? 700 : difficulty === "medium" ? 500 : 300,
    );

    return () => clearTimeout(t);
  }, [turn, board, winner, samuraiMovePending, difficulty]);

  async function finishGame() {
    if (!winner) return;
    if (winner === "draw") return onFinish?.("draw", 0);

    const outcome = winner === "R" ? "win" : "lose";
    const score = winner === "R" ? 1 : 0;
    if (!personId) return onFinish?.("player", 0);

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "connect4", score, personId, outcome }),
      });
      const j = await res.json();
      onFinish?.("player", j?.coinsAwarded ?? 0);
    } catch {
      onFinish?.("player", 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (winner) finishGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  function reset() {
    setBoard(emptyBoard());
    setTurn("R");
    setWinner(null);
    setSamuraiMovePending(false);
  }

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        textAlign: "center",
        maxWidth: 450,
        margin: "0 auto",
      }}
    >
      <h4 style={{ margin: "0 0 16px 0", fontSize: 22, fontWeight: 700 }}>
        🔴 4 em Linha
      </h4>

      {/* Selector de Dificuldade */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                setDifficulty(diff);
                reset();
              }}
              disabled={!!winner}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border:
                  difficulty === diff
                    ? "2px solid var(--accent)"
                    : "2px solid var(--card-border)",
                background:
                  difficulty === diff ? "var(--accent)" : "var(--card-bg)",
                color: difficulty === diff ? "#fff" : "var(--foreground)",
                cursor: winner ? "not-allowed" : "pointer",
                fontWeight: difficulty === diff ? 600 : 400,
                opacity: winner ? 0.5 : 1,
                transition: "all 0.2s ease",
                fontSize: 13,
              }}
            >
              {diff === "easy"
                ? "🟢 Fácil"
                : diff === "medium"
                  ? "🟡 Médio"
                  : "🔴 Difícil"}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div
        style={{
          marginBottom: 16,
          padding: "10px 16px",
          borderRadius: 10,
          background: winner
            ? winner === "draw"
              ? "rgba(107, 114, 128, 0.2)"
              : winner === "R"
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(245, 158, 11, 0.2)"
            : "rgba(239, 68, 68, 0.1)",
          color: winner
            ? winner === "draw"
              ? "var(--foreground)"
              : winner === "R"
                ? "#10b981"
                : "#f59e0b"
            : "var(--foreground)",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {status}
      </div>

      {/* Tabuleiro */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 42px)",
          gap: 6,
          width: "fit-content",
          margin: "0 auto 16px",
        }}
      >
        {Array.from({ length: COLS }).map((_, c) => (
          <button
            key={`top-${c}`}
            onClick={() => play(c, "R")}
            disabled={
              turn !== "R" ||
              !!winner ||
              getDropRow(board, c) === -1 ||
              samuraiMovePending
            }
            style={{
              height: 32,
              borderRadius: 8,
              border: "none",
              background:
                turn === "R" &&
                !winner &&
                !samuraiMovePending &&
                getDropRow(board, c) !== -1
                  ? "#ef4444"
                  : "rgba(239, 68, 68, 0.3)",
              color: "white",
              cursor:
                turn === "R" &&
                !winner &&
                !samuraiMovePending &&
                getDropRow(board, c) !== -1
                  ? "pointer"
                  : "not-allowed",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (
                turn === "R" &&
                !winner &&
                !samuraiMovePending &&
                getDropRow(board, c) !== -1
              ) {
                e.currentTarget.style.background = "#dc2626";
              }
            }}
            onMouseLeave={(e) => {
              if (
                turn === "R" &&
                !winner &&
                !samuraiMovePending &&
                getDropRow(board, c) !== -1
              ) {
                e.currentTarget.style.background = "#ef4444";
              }
            }}
          >
            ↓
          </button>
        ))}

        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background:
                  cell === "R"
                    ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                    : cell === "Y"
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "rgba(31, 41, 55, 0.5)",
                border: "3px solid rgba(255,255,255,0.2)",
                boxShadow: cell
                  ? "inset 0 -2px 8px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)"
                  : "inset 0 2px 8px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
              }}
            />
          )),
        )}
      </div>

      {/* Botão Reset */}
      {winner && (
        <div>
          <button
            onClick={reset}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🔄 Jogar Novamente
          </button>
        </div>
      )}

      {/* Legenda */}
      <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)" }}>
        💡 Conecta 4 peças na vertical, horizontal ou diagonal!
      </div>
    </div>
  );
}
