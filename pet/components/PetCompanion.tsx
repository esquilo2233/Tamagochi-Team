"use client";

import React, { useEffect, useState } from "react";

export default function PetCompanion({ code, onClose }: { code: string; onClose: () => void }) {
  const [pet, setPet] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start", code }),
        });
        const data = await res.json();
        if (data.ok) {
          setSession(data.session);
        }
      } catch (e) {
        console.error("Erro ao iniciar companhia", e);
      }
    }
    init();
  }, [code]);

  useEffect(() => {
    async function loadPet() {
      try {
        const res = await fetch("/api/pet");
        const p = await res.json();
        setPet(p);
      } catch (e) {}
    }
    loadPet();
    const interval = setInterval(loadPet, 30000); // atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session) return;
    
    // Atualizar moedas imediatamente
    async function updateCoins() {
      try {
        await fetch("/api/pet"); // processa ticks
        const sRes = await fetch(`/api/companion?code=${code}`);
        const sessions = await sRes.json();
        if (sessions && sessions.length > 0) {
          setCoinsEarned(sessions[0].coinsEarned || 0);
        }
      } catch (e) {}
    }
    
    updateCoins();
    const interval = setInterval(updateCoins, 60000); // verificar a cada minuto
    return () => clearInterval(interval);
  }, [session, code]);

  async function handleStop() {
    if (!session) return;
    try {
      await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", sessionId: session.id }),
      });
    } catch (e) {}
    onClose();
  }

  const avatarUrl = pet?.appearance && typeof pet.appearance === "string" && (pet.appearance.startsWith("/") || pet.appearance.startsWith("http"))
    ? pet.appearance
    : "/samurai.svg"; // Fallback local se não houver avatar no blob

  return (
    <div
      style={{
        width: 200,
        height: 280,
        background: "var(--card-bg)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "2px solid var(--card-border)",
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
        Fazendo companhia
      </div>
      
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          border: "1px solid var(--card-border)",
        }}
      >
        <img
          src={avatarUrl}
          alt="Pet"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {pet && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, textAlign: "center" }}>
          Felicidade: {pet.happiness ?? 100}%
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--foreground)", marginBottom: 12, textAlign: "center" }}>
        Moedas ganhas: <strong>{coinsEarned}</strong>
      </div>

      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 12, textAlign: "center" }}>
        1 moeda a cada 5 minutos
      </div>

      <button
        onClick={handleStop}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          background: "#d63031",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Parar companhia
      </button>
    </div>
  );
}
