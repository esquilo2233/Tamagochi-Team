"use client";

import React, { useState } from "react";
import ClickRush from "./ClickRush";
import TicTacToe from "./TicTacToe";
import ChessGame from "./ChessGame";
import ConnectFour from "./ConnectFour";
import Checkers from "./Checkers";
import Mahjong from "./Mahjong";
import Link from "next/link";

type GameType =
  | "clickrush"
  | "tictactoe"
  | "chess"
  | "connect4"
  | "checkers"
  | "mahjong"
  | null;

export default function MinigamesModal({
  isOpen,
  onClose,
  personId,
  onGameFinish,
}: {
  isOpen: boolean;
  onClose: () => void;
  personId?: number;
  onGameFinish?: () => void;
}) {
  const [activeGame, setActiveGame] = useState<GameType>(null);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0 }}>Minijogos</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            ×
          </button>
        </div>

        {!activeGame ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => setActiveGame("clickrush")}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              🎯 Click Rush
            </button>
            <button
              onClick={() => setActiveGame("tictactoe")}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ⭕ Jogo do Galo
            </button>
            <button
              onClick={() => setActiveGame("chess")}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ♟️ Xadrez (com dificuldade)
            </button>
            <button
              onClick={() => setActiveGame("connect4")}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              🟡 4 em Linha
            </button>
            <button
              onClick={() => setActiveGame("checkers")}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              ♟️ Damas
            </button>
            <button
              onClick={() => setActiveGame("mahjong")}
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              🀄 Mahjong Solitaire
            </button>
            <Link
              href="/team-play"
              target="_blank"
              style={{ textDecoration: "none" }}
            >
              <button
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 12,
                  background: "#2d8cff",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                🤝 Convidar por link (Team Building)
              </button>
            </Link>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setActiveGame(null)}
              style={{
                marginBottom: 16,
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--card-border)",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← Voltar
            </button>
            {activeGame === "clickrush" && (
              <ClickRush
                personId={personId}
                onFinish={() => {
                  setActiveGame(null);
                  onGameFinish?.();
                }}
              />
            )}
            {activeGame === "tictactoe" && (
              <TicTacToe
                personId={personId}
                onFinish={() => {
                  onGameFinish?.();
                }}
              />
            )}
            {activeGame === "chess" && (
              <ChessGame
                personId={personId}
                onFinish={() => {
                  onGameFinish?.();
                }}
              />
            )}
            {activeGame === "connect4" && (
              <ConnectFour
                personId={personId}
                onFinish={() => {
                  onGameFinish?.();
                }}
              />
            )}
            {activeGame === "checkers" && (
              <Checkers
                personId={personId}
                onFinish={() => {
                  onGameFinish?.();
                }}
              />
            )}
            {activeGame === "mahjong" && (
              <Mahjong
                personId={personId}
                onFinish={() => {
                  onGameFinish?.();
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
