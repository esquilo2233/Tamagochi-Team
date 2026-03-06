"use client";

import React, { useState } from "react";
import ClickRush from "./ClickRush";
import TicTacToe from "./TicTacToe";
import ChessGame from "./ChessGame";
import ConnectFour from "./ConnectFour";
import Checkers from "./Checkers";
import Mahjong from "./Mahjong";
import GameMenuModal from "./GameMenuModal";
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
  const [showMenu, setShowMenu] = useState(true);

  if (!isOpen) return null;

  // Mostrar menu de selecção de jogos
  if (showMenu || !activeGame) {
    return (
      <GameMenuModal
        isOpen={isOpen}
        onClose={onClose}
        onSelectGame={(game) => {
          setActiveGame(game);
          setShowMenu(false);
        }}
      />
    );
  }

  // Mostrar jogo seleccionado
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
          <button
            onClick={() => {
              setActiveGame(null);
              setShowMenu(true);
            }}
            style={{
              background: "var(--card-border)",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ← Voltar
          </button>
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

        {activeGame === "clickrush" && (
          <ClickRush
            personId={personId}
            onFinish={() => {
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
    </div>
  );
}
