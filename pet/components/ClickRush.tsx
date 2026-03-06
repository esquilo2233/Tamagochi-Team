"use client";

import React, { useEffect, useState } from "react";

export default function ClickRush({
  personId,
  onFinish,
}: {
  personId?: number;
  onFinish?: (score: number, coinsAwarded?: number) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(7);
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(t);
          setRunning(false);
          return 0;
        }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  async function finish() {
    setLoading(true);
    try {
      // send score to server
      const payload: any = { game: "clickrush", score: count };
      if (personId) payload.personId = personId;
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.ok) {
        setResultMsg(`Ganhaste ${j.coinsAwarded} moedas!`);
        onFinish?.(count, j.coinsAwarded);
      } else {
        setResultMsg("Resultado guardado localmente.");
        onFinish?.(count, 0);
      }
    } catch (e) {
      setResultMsg("Erro de rede — tenta novamente.");
      onFinish?.(count, 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!running) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: "var(--card-bg)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        textAlign: "center",
        color: "var(--foreground)",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0" }}>Click Rush</h4>
      <div style={{ marginBottom: 8, color: "var(--muted)" }}>
        Tempo: <strong>{timeLeft}s</strong>
      </div>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{count}</div>

      <div>
        <button
          onClick={() => {
            if (running) setCount((c) => c + 1);
          }}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: "#ff7675",
            color: "white",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          {running ? "Clica!" : loading ? "A enviar..." : "Concluído"}
        </button>
      </div>

      {!running && resultMsg && (
        <div style={{ marginTop: 10, color: "var(--foreground)" }}>
          {resultMsg}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <small style={{ color: "var(--muted-2)" }}>
          Moedas configuráveis no painel /admin.
        </small>
      </div>
    </div>
  );
}
