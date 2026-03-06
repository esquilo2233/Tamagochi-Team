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

function generateTiles(): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  // Layout pirâmide clássica simplificada
  const layouts = [
    // Camada 0 - Base (24 tiles em 6x4)
    { row: 0, col: 0, layer: 0 },
    { row: 0, col: 1, layer: 0 },
    { row: 0, col: 2, layer: 0 },
    { row: 0, col: 3, layer: 0 },
    { row: 1, col: 0, layer: 0 },
    { row: 1, col: 1, layer: 0 },
    { row: 1, col: 2, layer: 0 },
    { row: 1, col: 3, layer: 0 },
    { row: 2, col: 0, layer: 0 },
    { row: 2, col: 1, layer: 0 },
    { row: 2, col: 2, layer: 0 },
    { row: 2, col: 3, layer: 0 },
    { row: 3, col: 0, layer: 0 },
    { row: 3, col: 1, layer: 0 },
    { row: 3, col: 2, layer: 0 },
    { row: 3, col: 3, layer: 0 },
    { row: 4, col: 0, layer: 0 },
    { row: 4, col: 1, layer: 0 },
    { row: 4, col: 2, layer: 0 },
    { row: 4, col: 3, layer: 0 },
    { row: 5, col: 0, layer: 0 },
    { row: 5, col: 1, layer: 0 },
    { row: 5, col: 2, layer: 0 },
    { row: 5, col: 3, layer: 0 },

    // Camada 1 (12 tiles em 6x2)
    { row: 0, col: 1, layer: 1 },
    { row: 0, col: 2, layer: 1 },
    { row: 1, col: 1, layer: 1 },
    { row: 1, col: 2, layer: 1 },
    { row: 2, col: 1, layer: 1 },
    { row: 2, col: 2, layer: 1 },
    { row: 3, col: 1, layer: 1 },
    { row: 3, col: 2, layer: 1 },
    { row: 4, col: 1, layer: 1 },
    { row: 4, col: 2, layer: 1 },
    { row: 5, col: 1, layer: 1 },
    { row: 5, col: 2, layer: 1 },

    // Camada 2 (6 tiles)
    { row: 1, col: 1, layer: 2 },
    { row: 1, col: 2, layer: 2 },
    { row: 3, col: 1, layer: 2 },
    { row: 3, col: 2, layer: 2 },
    { row: 4, col: 1, layer: 2 },
    { row: 4, col: 2, layer: 2 },

    // Camada 3 - Topo (2 tiles)
    { row: 2, col: 1, layer: 3 },
    { row: 3, col: 1, layer: 3 },
  ];

  // Criar pares de tiles
  const pairsNeeded = Math.floor(layouts.length / 2);
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
  for (let i = 0; i < pairsNeeded; i++) {
    const tileType = tileTypes[i % tileTypes.length];
    const pos1 = layouts[i * 2];
    const pos2 = layouts[i * 2 + 1];

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

  // Verificar se há tile por cima (qualquer tile que sobreponha)
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

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !winner) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !winner && gameStarted) {
      finishGame(false);
    }
  }, [gameStarted, timeLeft, winner]);

  function initGame() {
    setTiles(generateTiles());
    setSelectedTile(null);
    setWinner(false);
    setMoves(0);
    setTimeLeft(300);
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

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        textAlign: "center",
        minHeight: 400,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <h4 style={{ margin: "0 0 12px 0" }}>🀄 Mahjong Solitaire</h4>

      {!gameStarted ? (
        <div style={{ padding: 40 }}>
          <p style={{ marginBottom: 16, color: "var(--muted)" }}>
            Combina pares de tiles idênticos para limpar o tabuleiro!
          </p>
          <button
            onClick={initGame}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            🎮 Iniciar Jogo
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 20,
              marginBottom: 12,
              fontSize: 13,
              flexWrap: "wrap",
            }}
          >
            <span>
              ⏱️{" "}
              <strong style={{ color: timeLeft < 60 ? "#ef4444" : "inherit" }}>
                {formatTime(timeLeft)}
              </strong>
            </span>
            <span>
              🎯 Jogadas: <strong>{moves}</strong>
            </span>
            <span>
              🀄 Restantes: <strong>{remainingPairs}</strong>
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
                      ? "linear-gradient(145deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)"
                      : "linear-gradient(145deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)",
                    border: isSelected
                      ? "3px solid #3b82f6"
                      : "2px solid #78716c",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    cursor: free ? "pointer" : "not-allowed",
                    opacity: free ? 1 : 0.5,
                    boxShadow: isSelected
                      ? "0 0 20px rgba(59, 130, 246, 0.6), 2px 2px 8px rgba(0,0,0,0.3)"
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
                  fontWeight: 600,
                }}
              >
                🎉 Parabéns! Completaste em {formatTime(300 - timeLeft)} com{" "}
                {moves} jogadas!
              </p>
              <button
                onClick={initGame}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                🔄 Jogar Novamente
              </button>
            </div>
          )}

          {!winner && (
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
              💡 Clica num tile livre (sem tiles à esquerda OU direita e sem
              tiles por cima)
            </div>
          )}
        </>
      )}
    </div>
  );
}
