"use client";

import React, { useState, useEffect } from "react";

type Player = "X" | "O" | null;
type Winner = "X" | "O" | "draw" | null;
type Board = Player[];
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
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
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
      // Fácil: mais aleatório
      const pref = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter(
        (idx) => squares[idx] === null,
      );
      if (Math.random() < 0.45 && pref.length > 0) return pref[0];
      return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
    }

    // 1) Samurai tenta ganhar
    for (const idx of emptyIndexes) {
      const test = [...squares];
      test[idx] = "O";
      if (calculateWinner(test) === "O") return idx;
    }

    // 2) Samurai bloqueia vitória do jogador
    for (const idx of emptyIndexes) {
      const test = [...squares];
      test[idx] = "X";
      if (calculateWinner(test) === "X") return idx;
    }

    // Hard: minimax (joga perfeito)
    if (difficulty === "hard") {
      function minimax(testBoard: Board, isSamuraiTurn: boolean): number {
        const w = calculateWinner(testBoard);
        if (w === "O") return 10;
        if (w === "X") return -10;
        if (testBoard.every((c) => c !== null)) return 0;

        const empties = testBoard
          .map((v, idx) => (v === null ? idx : -1))
          .filter((idx) => idx !== -1);

        if (isSamuraiTurn) {
          let best = -Infinity;
          for (const idx of empties) {
            const next = [...testBoard];
            next[idx] = "O";
            best = Math.max(best, minimax(next, false));
          }
          return best;
        }

        let best = Infinity;
        for (const idx of empties) {
          const next = [...testBoard];
          next[idx] = "X";
          best = Math.min(best, minimax(next, true));
        }
        return best;
      }

      let bestMove = emptyIndexes[0];
      let bestScore = -Infinity;
      for (const idx of emptyIndexes) {
        const test = [...squares];
        test[idx] = "O";
        const score = minimax(test, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }
      return bestMove;
    }

    // 3) Centro (médio)
    if (squares[4] === null) return 4;

    // 4) Cantos
    const corners = [0, 2, 6, 8].filter((idx) => squares[idx] === null);
    if (corners.length > 0) return corners[0];

    // 5) Laterais
    const sides = [1, 3, 5, 7].filter((idx) => squares[idx] === null);
    if (sides.length > 0) return sides[0];

    return emptyIndexes[0];
  }

  function handleClick(i: number) {
    // Jogador humano é sempre X; Samurai é O
    if (board[i] || winner || !isXNext || samuraiMovePending) return;

    const newBoard = [...board];
    newBoard[i] = "X";
    setBoard(newBoard);

    // Verificar vitória/empate IMEDIATAMENTE
    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      return;
    } else if (newBoard.every((cell) => cell !== null)) {
      setWinner("draw");
      return;
    }

    // Passar vez ao Samurai
    setIsXNext(false);
    setSamuraiMovePending(true);
  }

  useEffect(() => {
    // Se já há vencedor ou não é vez do Samurai, não faz nada
    if (winner || isXNext || !samuraiMovePending) return;

    const moveIndex = getBestSamuraiMove(board);
    if (moveIndex < 0) return;

    const timer = setTimeout(
      () => {
        setBoard((prev) => {
          // Verificar novamente se a célula está vazia
          if (prev[moveIndex]) return prev;
          const next = [...prev];
          next[moveIndex] = "O";

          // Verificar se há vencedor ou empate IMEDIATAMENTE
          const newWinner = calculateWinner(next);
          if (newWinner) {
            setWinner(newWinner);
          } else if (next.every((cell) => cell !== null)) {
            setWinner("draw");
          } else {
            // Continuar jogo - vez do jogador
            setIsXNext(true);
          }

          // Limpar flag do Samurai
          setSamuraiMovePending(false);

          return next;
        });
      },
      difficulty === "easy" ? 500 : difficulty === "medium" ? 350 : 200,
    );

    return () => clearTimeout(timer);
  }, [board, winner, isXNext, samuraiMovePending, difficulty]);

  async function finish() {
    if (!winner) {
      return;
    }

    if (winner === "draw") {
      onFinish?.("draw", 0);
      return;
    }
    setLoading(true);
    try {
      const outcome = winner === "X" ? "win" : "lose";
      const score = winner === "X" ? 1 : 0; // score de registo (moedas são decididas no backend)
      const payload: any = { game: "tictactoe", score };
      payload.outcome = outcome;
      if (personId) payload.personId = personId;
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.ok) {
        onFinish?.(winner, j.coinsAwarded || 0);
      } else {
        onFinish?.(winner, 0);
      }
    } catch (e) {
      onFinish?.(winner, 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (winner) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  function reset() {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setSamuraiMovePending(false);
  }

  function renderSquare(i: number) {
    return (
      <button
        onClick={() => handleClick(i)}
        disabled={!!board[i] || !!winner || loading}
        style={{
          width: 60,
          height: 60,
          fontSize: 32,
          fontWeight: "bold",
          border: "2px solid var(--card-border)",
          background: board[i] ? "var(--card-bg)" : "var(--background)",
          color:
            board[i] === "X"
              ? "#ff6b6b"
              : board[i] === "O"
                ? "#4ecdc4"
                : "var(--foreground)",
          cursor: board[i] || winner ? "not-allowed" : "pointer",
          borderRadius: 8,
        }}
      >
        {board[i]}
      </button>
    );
  }

  const status = winner
    ? winner === "draw"
      ? "Empate!"
      : `Vencedor: ${winner === "X" ? "Tu" : "Samurai"}`
    : `Próximo: ${isXNext ? "Tu (X)" : "Samurai (O)"}`;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        background: "var(--card-bg)",
        textAlign: "center",
      }}
    >
      <h4 style={{ margin: "0 0 12px 0" }}>Jogo do Galo — Tu vs Samurai</h4>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "center",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          Dificuldade:
        </span>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          disabled={!!winner || loading || !isXNext}
          style={{ borderRadius: 8, padding: "6px 8px" }}
        >
          <option value="easy">Fácil</option>
          <option value="medium">Médio</option>
          <option value="hard">Difícil</option>
        </select>
      </div>
      <div style={{ marginBottom: 12, color: "var(--muted)" }}>{status}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 60px)",
          gap: 4,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => renderSquare(i))}
      </div>
      {winner && (
        <div>
          <button
            onClick={reset}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
}
