"use client";

import React, { useState, useEffect } from "react";

type Player = "X" | "O" | null;
type Winner = "X" | "O" | "draw" | null;
type Board = Player[];

export default function TicTacToe({ personId, onFinish }: { personId?: number; onFinish?: (winner: Player | null, score: number) => void }) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Winner>(null);
  const [loading, setLoading] = useState(false);

  function calculateWinner(squares: Board): Player {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
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

    // 3) Centro
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
    if (board[i] || winner || !isXNext) return;

    const newBoard = [...board];
    newBoard[i] = "X";
    setBoard(newBoard);
    setIsXNext(false);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
    } else if (newBoard.every(cell => cell !== null)) {
      setWinner("draw");
    }
  }

  useEffect(() => {
    if (winner || isXNext) return;

    const moveIndex = getBestSamuraiMove(board);
    if (moveIndex < 0) return;

    const timer = setTimeout(() => {
      setBoard((prev) => {
        if (prev[moveIndex] || winner) return prev;
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

        return next;
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [isXNext, board, winner]);

  async function finish() {
    if (!winner || winner === "draw") {
      onFinish?.(null, 0);
      return;
    }
    setLoading(true);
    try {
      const score = winner === "X" ? 10 : 2; // vitória: 10 | derrota: 2
      const payload: any = { game: 'tictactoe', score };
      if (personId) payload.personId = personId;
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.ok) {
        onFinish?.(winner as Player, j.coinsAwarded || 0);
      } else {
        onFinish?.(winner as Player, 0);
      }
    } catch (e) {
      onFinish?.(winner as Player, 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (winner && winner !== "draw") {
      finish();
    }
  }, [winner]);

  function reset() {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
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
          fontWeight: 'bold',
          border: '2px solid var(--card-border)',
          background: board[i] ? 'var(--card-bg)' : 'var(--background)',
          color: board[i] === 'X' ? '#ff6b6b' : board[i] === 'O' ? '#4ecdc4' : 'var(--foreground)',
          cursor: board[i] || winner ? 'not-allowed' : 'pointer',
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
    <div style={{ padding: 16, borderRadius: 8, background: 'var(--card-bg)', textAlign: 'center' }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Jogo do Galo — Tu vs Samurai</h4>
      <div style={{ marginBottom: 12, color: 'var(--muted)' }}>{status}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 12, justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => renderSquare(i))}
      </div>
      {winner && (
        <div>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
}
