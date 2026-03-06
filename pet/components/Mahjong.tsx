"use client";

import React, { useState, useEffect } from "react";

type Tile = {
  id: number;
  suit: "dots" | "bamboo" | "characters" | "winds" | "dragons";
  value: number;
  row: number;
  col: number;
  layer: number;
  matched: boolean;
};

type Difficulty = "easy" | "medium" | "hard";

const SUITS: Tile["suit"][] = [
  "dots",
  "bamboo",
  "characters",
  "winds",
  "dragons",
];
const TILE_SYMBOLS: Record<string, string[]> = {
  dots: ["🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"],
  bamboo: ["🀐", "🀑", "🀒", "🀓", "🀔", "🀕", "🀖", "🀗", "🀘"],
  characters: ["🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏"],
  winds: ["🀀", "🀁", "🀂", "🀃"],
  dragons: ["🀄", "🀅", "🀆"],
};

function generateTiles(difficulty: Difficulty): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  // Configuração por dificuldade
  const config = {
    easy: { layers: 2, pairs: 18 },
    medium: { layers: 3, pairs: 24 },
    hard: { layers: 4, pairs: 36 },
  };

  const { layers, pairs } = config[difficulty];

  // Gerar posições baseadas na dificuldade
  const layouts: { row: number; col: number; layer: number }[] = [];

  for (let layer = 0; layer < layers; layer++) {
    const rows = 6 - layer;
    const cols = 4 - Math.floor(layer / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        layouts.push({ row: r, col: c, layer });
      }
    }
  }

  // Criar pares de tiles
  const tileTypes: { suit: Tile["suit"]; value: number }[] = [];

  SUITS.forEach((suit) => {
    const values =
      suit === "winds"
        ? [0, 1, 2, 3]
        : suit === "dragons"
          ? [0, 1, 2]
          : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    values.forEach((value) => {
      tileTypes.push({ suit, value });
    });
  });

  // Distribuir tiles em pares
  for (let i = 0; i < pairs; i++) {
    const tileType = tileTypes[i % tileTypes.length];
    const pos1 = layouts[(i * 2) % layouts.length];
    const pos2 = layouts[(i * 2 + 1) % layouts.length];

    tiles.push({
      id: id++,
      suit: tileType.suit,
      value: tileType.value,
      row: pos1.row,
      col: pos1.col,
      layer: pos1.layer,
      matched: false,
    });

    tiles.push({
      id: id++,
      suit: tileType.suit,
      value: tileType.value,
      row: pos2.row,
      col: pos2.col,
      layer: pos2.layer,
      matched: false,
    });
  }

  return tiles;
}

function isTileFree(tile: Tile, allTiles: Tile[]): boolean {
  if (tile.matched) return false;

  // Verificar se há tile por cima
  const hasTileAbove = allTiles.some(
    (t) =>
      !t.matched &&
      t.layer === tile.layer + 1 &&
      Math.abs(t.row - tile.row) <= 0.5 &&
      Math.abs(t.col - tile.col) <= 0.5,
  );

  if (hasTileAbove) return false;

  // Verificar se tem espaço à esquerda OU à direita
  const hasTileLeft = allTiles.some(
    (t) =>
      !t.matched &&
      t.layer === tile.layer &&
      t.row === tile.row &&
      t.col === tile.col - 1,
  );

  const hasTileRight = allTiles.some(
    (t) =>
      !t.matched &&
      t.layer === tile.layer &&
      t.row === tile.row &&
      t.col === tile.col + 1,
  );

  return !hasTileLeft || !hasTileRight;
}

function tilesMatch(tile1: Tile, tile2: Tile): boolean {
  return tile1.suit === tile2.suit && tile1.value === tile2.value;
}

export default function Mahjong({
  personId,
  onFinish,
}: {
  personId?: number;
  onFinish?: (completed: boolean, score: number) => void;
}) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [winner, setWinner] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !winner) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !winner && gameStarted) {
      finishGame(false);
    }
  }, [gameStarted, timeLeft, winner]);

  function initGame() {
    setTiles(generateTiles(difficulty));
    setSelectedTile(null);
    setWinner(false);
    setMoves(0);
    setTimeLeft(
      difficulty === "easy" ? 600 : difficulty === "medium" ? 300 : 180,
    );
    setGameStarted(true);
  }

  const freeTiles = tiles.filter((t) => !t.matched && isTileFree(t, tiles));

  function handleTileClick(tile: Tile) {
    if (winner || !gameStarted || !isTileFree(tile, tiles)) return;

    if (selectedTile && selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    if (selectedTile && selectedTile.id !== tile.id) {
      if (tilesMatch(selectedTile, tile)) {
        setTiles((prev) =>
          prev.map((t) =>
            t.id === selectedTile!.id || t.id === tile.id
              ? { ...t, matched: true }
              : t,
          ),
        );
        setSelectedTile(null);
        setMoves((m) => m + 1);

        const remaining = tiles.filter(
          (t) => !t.matched && t.id !== selectedTile!.id && t.id !== tile.id,
        );
        if (remaining.length === 0) {
          setWinner(true);
          finishGame(true);
        }
      } else {
        setSelectedTile(tile);
      }
    } else {
      setSelectedTile(tile);
    }
  }

  async function finishGame(completed: boolean) {
    if (!personId) {
      onFinish?.(completed, 0);
      return;
    }

    setLoading(true);
    try {
      const score = completed ? Math.floor(timeLeft / 10) + moves : 0;
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "mahjong",
          score: completed ? 1 : 0,
          personId,
          outcome: completed ? "win" : "lose",
        }),
      });
      const j = await res.json();
      onFinish?.(completed, j?.coinsAwarded ?? 0);
    } catch {
      onFinish?.(completed, 0);
    } finally {
      setLoading(false);
    }
  }

  function getTileSymbol(tile: Tile): string {
    return TILE_SYMBOLS[tile.suit][tile.value] || "🀄";
  }

  function getTilePosition(tile: Tile) {
    const offsetX = (tile.col - tile.row) * 20;
    const offsetY = (tile.col + tile.row) * 10;
    const zIndex = 100 + tile.layer * 10;

    return {
      left: `calc(50% + ${offsetX}px)`,
      top: `${offsetY + tile.layer * -3}px`,
      zIndex,
    };
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingPairs = tiles.filter((t) => !t.matched).length / 2;

  if (!gameStarted) {
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: "var(--card-bg)",
          color: "var(--foreground)",
          textAlign: "center",
          maxWidth: 500,
          margin: "0 auto",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 24 }}>
          🀄 Mahjong Solitaire
        </h3>

        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>
            Combina pares de tiles idênticos para limpar o tabuleiro!
          </p>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              Dificuldade:
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border:
                      difficulty === diff
                        ? "2px solid var(--accent)"
                        : "2px solid var(--card-border)",
                    background:
                      difficulty === diff ? "var(--accent)" : "var(--card-bg)",
                    color: difficulty === diff ? "#fff" : "var(--foreground)",
                    cursor: "pointer",
                    fontWeight: difficulty === diff ? 600 : 400,
                    transition: "all 0.2s ease",
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
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              {difficulty === "easy"
                ? "⏱️ 10 minutos • 18 pares"
                : difficulty === "medium"
                  ? "⏱️ 5 minutos • 24 pares"
                  : "⏱️ 3 minutos • 36 pares"}
            </p>
          </div>
        </div>

        <button
          onClick={initGame}
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            border: "none",
            background: "var(--accent)",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 16,
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🎮 Iniciar Jogo
        </button>

        <div style={{ marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
          💡 Clica num tile livre (sem tiles à esquerda OU direita e sem tiles
          por cima)
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        textAlign: "center",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background:
              timeLeft < 60
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(59, 130, 246, 0.2)",
            color: timeLeft < 60 ? "#ef4444" : "var(--foreground)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          ⏱️ {formatTime(timeLeft)}
        </span>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(16, 185, 129, 0.2)",
            color: "var(--foreground)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          🎯 {moves} jogadas
        </span>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(245, 158, 11, 0.2)",
            color: "var(--foreground)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          🀄 {remainingPairs} restantes
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width: 380,
          height: 280,
          margin: "0 auto",
        }}
      >
        {tiles.map((tile) => {
          if (tile.matched) return null;

          const free = isTileFree(tile, tiles);
          const isSelected = selectedTile?.id === tile.id;
          const pos = getTilePosition(tile);

          return (
            <div
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                width: 38,
                height: 48,
                background: free
                  ? "linear-gradient(145deg, rgba(254, 243, 199, 0.9) 0%, rgba(253, 230, 138, 0.9) 50%, rgba(252, 211, 77, 0.9) 100%)"
                  : "linear-gradient(145deg, rgba(156, 163, 175, 0.5) 0%, rgba(107, 114, 128, 0.5) 50%, rgba(75, 85, 99, 0.5) 100%)",
                backdropFilter: "blur(4px)",
                border: isSelected
                  ? "3px solid #3b82f6"
                  : "2px solid rgba(120, 113, 108, 0.5)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                cursor: free ? "pointer" : "not-allowed",
                opacity: free ? 1 : 0.5,
                boxShadow: isSelected
                  ? "0 0 20px rgba(59, 130, 246, 0.6), 2px 2px 6px rgba(0,0,0,0.3)"
                  : "2px 2px 6px rgba(0,0,0,0.4)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                transform: isSelected ? "scale(1.12)" : "scale(1)",
                userSelect: "none",
                zIndex: pos.zIndex,
              }}
            >
              {getTileSymbol(tile)}
            </div>
          );
        })}
      </div>

      {winner && (
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              fontSize: 16,
              marginBottom: 12,
              color: "#10b981",
              fontWeight: 700,
            }}
          >
            🎉 Parabéns! Completaste em {formatTime(300 - timeLeft)} com {moves}{" "}
            jogadas!
          </p>
          <button
            onClick={initGame}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🔄 Jogar Novamente
          </button>
        </div>
      )}

      {!winner && (
        <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
          💡 Clica num tile livre para seleccionar
        </div>
      )}
    </div>
  );
}
