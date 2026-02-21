"use client";

import React, { useEffect, useMemo, useState } from "react";

type Cell = "R" | "Y" | null;
type Winner = "R" | "Y" | "draw" | null;

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
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== cell) {
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

function aiMove(board: Cell[][]): number {
  const legalCols = Array.from({ length: COLS }, (_, c) => c).filter((c) => getDropRow(board, c) !== -1);
  if (!legalCols.length) return -1;

  // ganhar já
  for (const c of legalCols) {
    const r = getDropRow(board, c);
    const test = board.map((row) => [...row]);
    test[r][c] = "Y";
    if (checkWinner(test) === "Y") return c;
  }

  // bloquear jogador
  for (const c of legalCols) {
    const r = getDropRow(board, c);
    const test = board.map((row) => [...row]);
    test[r][c] = "R";
    if (checkWinner(test) === "R") return c;
  }

  // centro preferido
  const pref = [3, 2, 4, 1, 5, 0, 6];
  return pref.find((c) => legalCols.includes(c)) ?? legalCols[0];
}

export default function ConnectFour({ personId, onFinish }: { personId?: number; onFinish?: (winner: "player" | "samurai" | "draw", score: number) => void }) {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard());
  const [turn, setTurn] = useState<"R" | "Y">("R");
  const [winner, setWinner] = useState<Winner>(null);
  const [loading, setLoading] = useState(false);

  const status = useMemo(() => {
    if (winner === "draw") return "Empate!";
    if (winner === "R") return "Ganhaste!";
    if (winner === "Y") return "Samurai venceu.";
    return turn === "R" ? "A tua vez (vermelho)." : "Vez do Samurai...";
  }, [winner, turn]);

  function play(col: number, piece: "R" | "Y") {
    if (winner) return;
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
    }
  }

  useEffect(() => {
    if (winner || turn !== "Y") return;
    const t = setTimeout(() => {
      const c = aiMove(board);
      if (c >= 0) play(c, "Y");
    }, 350);
    return () => clearTimeout(t);
  }, [turn, board, winner]);

  async function finishGame() {
    if (!winner) return;
    if (winner === "draw") return onFinish?.("draw", 0);

    const outcome = winner === "R" ? "win" : "lose";
    const score = winner === "R" ? 1 : 0; // score de registo; moedas vêm da configuração no backend
    if (!personId) return onFinish?.(winner === "R" ? "player" : "samurai", 0);

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "connect4", score, personId, outcome }),
      });
      const j = await res.json();
      onFinish?.(winner === "R" ? "player" : "samurai", j?.coinsAwarded ?? 0);
    } catch {
      onFinish?.(winner === "R" ? "player" : "samurai", 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (winner) finishGame();
  }, [winner]);

  function reset() {
    setBoard(emptyBoard());
    setTurn("R");
    setWinner(null);
  }

  return (
    <div style={{ padding: 12, borderRadius: 8, background: "var(--card-bg)", color: "var(--foreground)" }}>
      <h4 style={{ marginTop: 0 }}>🟡 4 em Linha — Tu vs Samurai</h4>
      <div style={{ marginBottom: 8, color: "var(--muted)" }}>{status}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 48px)", gap: 6, width: "fit-content", margin: "0 auto" }}>
        {Array.from({ length: COLS }).map((_, c) => (
          <button
            key={`top-${c}`}
            onClick={() => play(c, "R")}
            disabled={turn !== "R" || !!winner || getDropRow(board, c) === -1 || loading}
            style={{ height: 30, borderRadius: 8, border: "none", background: "var(--accent)", color: "white", cursor: "pointer" }}
          >
            ↓
          </button>
        ))}

        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: cell === "R" ? "#ef4444" : cell === "Y" ? "#facc15" : "#1f2937",
                border: "3px solid rgba(255,255,255,0.25)",
              }}
            />
          ))
        )}
      </div>

      {winner && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <button onClick={reset} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "var(--accent)", color: "white", cursor: "pointer" }}>
            Novo jogo
          </button>
        </div>
      )}
    </div>
  );
}
