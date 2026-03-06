"use client";

import React, { useState, useEffect } from "react";

type Player = "X" | "O" | null;
type Board = Player[];
type Winner = "X" | "O" | "draw" | null;
type Difficulty = "easy" | "medium" | "hard";

export default function TicTacToe({
  personId,
  onFinish,
}: {
  personId?: number;
  onFinish?: (winner: "X" | "O" | "draw", score: number) => void;
}) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Winner>(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [samuraiMovePending, setSamuraiMovePending] = useState(false);

  function calculateWinner(squares: Board): Player {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  }

  function getBestSamuraiMove(squares: Board): number {
    const emptyIndexes = squares
      .map((v, idx) => (v === null ? idx : -1))
      .filter((idx) => idx !== -1);
    if (emptyIndexes.length === 0) return -1;

    if (difficulty === "easy") {
      const shouldPlaySmart = Math.random() < 0.7;
      if (shouldPlaySmart) {
        for (const idx of emptyIndexes) {
          const test = [...squares];
          test[idx] = "O";
          if (calculateWinner(test) === "O") return idx;
        }
        for (const idx of emptyIndexes) {
          const test = [...squares];
          test[idx] = "X";
          if (calculateWinner(test) === "X") return idx;
        }
      }
      const pref = [4, 0, 2, 6, 8].filter((idx) => squares[idx] === null);
      if (pref.length > 0) return pref[Math.floor(Math.random() * pref.length)];
      return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    }

    if (difficulty === "medium") {
      for (const idx of emptyIndexes) {
        const test = [...squares];
        test[idx] = "O";
        if (calculateWinner(test) === "O") return idx;
      }
      for (const idx of emptyIndexes) {
        const test = [...squares];
        test[idx] = "X";
        if (calculateWinner(test) === "X") return idx;
      }
      if (squares[4] === null && Math.random() < 0.95) return 4;
      const corners = [0, 2, 6, 8].filter((idx) => squares[idx] === null);
      if (corners.length > 0)
        return corners[Math.floor(Math.random() * corners.length)];
      const sides = [1, 3, 5, 7].filter((idx) => squares[idx] === null);
      if (sides.length > 0)
        return sides[Math.floor(Math.random() * sides.length)];
      return emptyIndexes[0];
    }

    if (difficulty === "hard") {
      function minimax(
        testBoard: Board,
        depth: number,
        isSamuraiTurn: boolean,
        alpha: number,
        beta: number,
      ): number {
        const w = calculateWinner(testBoard);
        if (w === "O") return 10 - depth;
        if (w === "X") return depth - 10;
        if (testBoard.every((c) => c !== null)) return 0;

        const empties = testBoard
          .map((v, idx) => (v === null ? idx : -1))
          .filter((idx) => idx !== -1);

        if (isSamuraiTurn) {
          let best = -Infinity;
          for (const idx of empties) {
            const next = [...testBoard];
            next[idx] = "O";
            best = Math.max(best, minimax(next, depth + 1, false, alpha, beta));
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
          }
          return best;
        }

        let best = Infinity;
        for (const idx of empties) {
          const next = [...testBoard];
          next[idx] = "X";
          best = Math.min(best, minimax(next, depth + 1, true, alpha, beta));
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
        return best;
      }

      let bestMove = emptyIndexes[0];
      let bestScore = -Infinity;
      if (squares[4] === null) {
        const test = [...squares];
        test[4] = "O";
        const score = minimax(test, 1, false, -Infinity, Infinity);
        if (score > bestScore) {
          bestScore = score;
          bestMove = 4;
        }
      }
      for (const idx of emptyIndexes) {
        if (idx === 4) continue;
        const test = [...squares];
        test[idx] = "O";
        const score = minimax(test, 1, false, -Infinity, Infinity);
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }
      return bestMove;
    }

    return emptyIndexes[0];
  }

  function handleClick(i: number) {
    if (board[i] || winner || !isXNext || samuraiMovePending) return;

    const newBoard = [...board];
    newBoard[i] = "X";
    setBoard(newBoard);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      return;
    } else if (newBoard.every((cell) => cell !== null)) {
      setWinner("draw");
      return;
    }

    setIsXNext(false);
    setSamuraiMovePending(true);
  }

  useEffect(() => {
    if (winner || isXNext || !samuraiMovePending) return;

    const moveIndex = getBestSamuraiMove(board);
    if (moveIndex < 0) return;

    const timer = setTimeout(
      () => {
        setBoard((prev) => {
          if (prev[moveIndex]) return prev;
          const next = [...prev];
          next[moveIndex] = "O";

          const newWinner = calculateWinner(next);
          if (newWinner) {
            setWinner(newWinner);
          } else if (next.every((cell) => cell !== null)) {
            setWinner("draw");
          } else {
            setIsXNext(true);
          }

          setSamuraiMovePending(false);
          return next;
        });
      },
      difficulty === "easy" ? 600 : difficulty === "medium" ? 400 : 250,
    );

    return () => clearTimeout(timer);
  }, [board, winner, isXNext, samuraiMovePending, difficulty]);

  async function finish() {
    if (!winner) return;
    if (winner === "draw") {
      onFinish?.("draw", 0);
      return;
    }

    setLoading(true);
    try {
      const outcome = winner === "X" ? "win" : "lose";
      const score = winner === "X" ? 1 : 0;
      const payload: any = { game: "tictactoe", score, outcome };
      if (personId) payload.personId = personId;
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      onFinish?.(winner, j.coinsAwarded || 0);
    } catch (e) {
      onFinish?.(winner, 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (winner) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  function reset() {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setSamuraiMovePending(false);
  }

  const status = winner
    ? winner === "draw"
      ? "🤝 Empate!"
      : winner === "X"
        ? "🎉 Ganhaste!"
        : "🤖 Samurai venceu!"
    : `Próximo: ${isXNext ? "Tu (X)" : "Samurai (O)"}`;

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        textAlign: "center",
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <h4 style={{ margin: "0 0 16px 0", fontSize: 22, fontWeight: 700 }}>
        ⭕ Jogo do Galo
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
              : winner === "X"
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(239, 68, 68, 0.2)"
            : "rgba(59, 130, 246, 0.1)",
          color: winner
            ? winner === "draw"
              ? "var(--foreground)"
              : winner === "X"
                ? "#10b981"
                : "#ef4444"
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
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          maxWidth: 280,
          margin: "0 auto 20px",
        }}
      >
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            disabled={!!cell || !!winner || (!isXNext && !winner)}
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              fontSize: "clamp(32px, 10vw, 48px)",
              fontWeight: 800,
              borderRadius: 12,
              border: "2px solid var(--card-border)",
              background: cell
                ? cell === "X"
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(59, 130, 246, 0.15)"
                : "var(--card-bg)",
              color:
                cell === "X"
                  ? "#ef4444"
                  : cell === "O"
                    ? "#3b82f6"
                    : "var(--foreground)",
              cursor: !cell && !winner && isXNext ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              boxShadow: cell ? "inset 0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!cell && !winner && isXNext) {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!cell && !winner && isXNext) {
                e.currentTarget.style.background = cell ? "" : "var(--card-bg)";
              }
            }}
          >
            {cell === "X" ? "❌" : cell === "O" ? "⭕" : ""}
          </button>
        ))}
      </div>

      {/* Botão Reset */}
      {winner && (
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
      )}

      {/* Legenda */}
      <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)" }}>
        💡 Faz 3 em linha para ganhar!
      </div>
    </div>
  );
}
