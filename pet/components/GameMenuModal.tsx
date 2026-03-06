"use client";

import React from "react";
import Link from "next/link";

type GameType =
  | "clickrush"
  | "tictactoe"
  | "chess"
  | "connect4"
  | "checkers"
  | "mahjong";

interface Game {
  id: GameType;
  name: string;
  icon: string;
  description: string;
  color: string;
  players: string;
}

const games: Game[] = [
  {
    id: "clickrush",
    name: "Click Rush",
    icon: "⚡",
    description: "Clica o mais rápido que conseguires!",
    color: "#ef4444",
    players: "1 Jogador",
  },
  {
    id: "tictactoe",
    name: "Jogo do Galo",
    icon: "⭕",
    description: "3 em linha para vencer!",
    color: "#3b82f6",
    players: "1 vs CPU",
  },
  {
    id: "chess",
    name: "Xadrez",
    icon: "♟️",
    description: "O jogo de estratégia clássico!",
    color: "#8b5cf6",
    players: "1 vs CPU",
  },
  {
    id: "connect4",
    name: "4 em Linha",
    icon: "🔴",
    description: "Conecta 4 peças para ganhar!",
    color: "#f59e0b",
    players: "1 vs CPU",
  },
  {
    id: "checkers",
    name: "Damas",
    icon: "♟️",
    description: "Captura todas as peças do adversário!",
    color: "#10b981",
    players: "1 vs CPU",
  },
  {
    id: "mahjong",
    name: "Mahjong",
    icon: "🀄",
    description: "Combina os pares de tiles!",
    color: "#ec4899",
    players: "1 Jogador",
  },
];

interface MinigamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: GameType) => void;
}

export default function GameMenuModal({
  isOpen,
  onClose,
  onSelectGame,
}: MinigamesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: 20,
          padding: 24,
          maxWidth: 800,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
              🎮 Minijogos
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "var(--muted)",
                fontSize: 14,
              }}
            >
              Escolhe um jogo e diverte-te!
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 32,
              cursor: "pointer",
              color: "var(--muted)",
              padding: "4px 8px",
              borderRadius: 8,
              transition: "background 0.2s",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              style={{
                background: `linear-gradient(135deg, ${game.color}15 0%, ${game.color}25 100%)`,
                border: `2px solid ${game.color}40`,
                borderRadius: 16,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 24px ${game.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 48 }}>{game.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                  {game.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 8,
                  }}
                >
                  {game.description}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: game.color,
                    fontWeight: 600,
                    background: `${game.color}20`,
                    padding: "4px 8px",
                    borderRadius: 12,
                    display: "inline-block",
                  }}
                >
                  {game.players}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Team Building - Multiplayer Online */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "2px dashed var(--card-border)",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: 16,
              color: "var(--muted)",
            }}
          >
            🌐 Multiplayer Online
          </h3>
          <Link
            href="/team-play"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: 16,
                padding: 20,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(99, 102, 241, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(99, 102, 241, 0.3)";
              }}
            >
              <div style={{ fontSize: 40 }}>🤝</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>
                  Team Building
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                  Joga online com a tua equipa!
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#fff",
                    background: "rgba(255,255,255,0.2)",
                    padding: "4px 8px",
                    borderRadius: 12,
                    display: "inline-block",
                    marginTop: 6,
                  }}
                >
                  👥 2 Jogadores Online
                </div>
              </div>
            </button>
          </Link>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--card-border)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            💡 Dica: Podes jogar quantas vezes quiseres!
          </p>
        </div>
      </div>
    </div>
  );
}
