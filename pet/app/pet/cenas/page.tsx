"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

function isAvatarPath(appearance: string | null | undefined): appearance is string {
  return typeof appearance === "string" && (appearance.startsWith("/") || appearance.startsWith("http"));
}

export default function CenasPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [decayConfig, setDecayConfig] = useState({
    hungerDecayPerMinute: 0.5,
    energyDecayPerMinute: 0.3,
    happinessDecayPerMinute: 0.45,
    hygieneDecayPerMinute: 0.2,
    lifeDecayWhenHungerZeroPerMinute: 0.5,
    lifeDecayWhenEnergyZeroPerMinute: 0.4,
    lifeDecayWhenHygieneZeroPerMinute: 0.3,
    lowAttentionEnabled: true,
    lowAttentionStartHour: 16,
    lowAttentionEndHour: 9,
    lowAttentionDecayMultiplier: 0.08,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((j) => {
        const role = String(j?.person?.role ?? "").toLowerCase();
        setHasAccess(j?.ok && (role === "admin" || role === "gestor"));
      })
      .catch(() => setHasAccess(false))
      .finally(() => setCheckingAccess(false));

    fetch("/api/pet")
      .then((r) => r.json())
      .then((p) => {
        if (p?.appearance && isAvatarPath(p.appearance)) setPreview(p.appearance);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    fetch("/api/settings/decay")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j?.config) setDecayConfig((c) => ({ ...c, ...j.config }));
      })
      .catch(() => {});
  }, [hasAccess]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input?.files?.length) {
      setError("Escolha uma imagem.");
      return;
    }
    const file = input.files[0];
    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/pet/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer upload.");
        return;
      }
      setSuccess(true);
      setPreview(data.avatarUrl ? data.avatarUrl + "?t=" + Date.now() : null);
      input.value = "";
    } catch (err) {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function saveDecaySettings() {
    if (!hasAccess) return;
    setSavingConfig(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/decay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decayConfig),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        setError(j?.error ?? "Erro ao guardar configuração de decadência");
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2200);
    } catch {
      setError("Erro de ligação ao guardar configuração");
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      {checkingAccess ? (
        <div style={{ padding: 16, borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--card-border)", marginBottom: 16 }}>
          A verificar permissões...
        </div>
      ) : !hasAccess ? (
        <div style={{ padding: 16, borderRadius: 8, background: "#fff3cd", color: "#856404", marginBottom: 16 }}>
          Sem permissão para aceder ao painel Cenas. Apenas pessoas com role <strong>admin</strong> ou <strong>gestor</strong> podem entrar.
        </div>
      ) : null}

      {hasAccess && (
        <>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
          ← Voltar ao Samurai
        </Link>
      </div>

      <h1 style={{ marginBottom: 8 }}>Cenas / Gestão</h1>
      <p style={{ color: "var(--muted)", marginBottom: 16 }}>
        Menu rápido para mexer em pessoas, itens da loja e avatar do Samurai.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Link
          href="/people"
          style={{
            textDecoration: "none",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 10,
            padding: 12,
            color: "var(--foreground)",
            fontWeight: 600,
          }}
        >
          👥 Gerir Pessoas
        </Link>

        <Link
          href="/items"
          style={{
            textDecoration: "none",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 10,
            padding: 12,
            color: "var(--foreground)",
            fontWeight: 600,
          }}
        >
          🛠️ Gerir Itens
        </Link>

        <a
          href="#avatar"
          style={{
            textDecoration: "none",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 10,
            padding: 12,
            color: "var(--foreground)",
            fontWeight: 600,
          }}
        >
          🖼️ Avatar do Samurai
        </a>
      </div>

      <h2 id="avatar" style={{ marginBottom: 8, fontSize: 22 }}>Avatar do Samurai</h2>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Escolha uma imagem para ser o avatar do boneco na página principal. Formatos: JPEG, PNG, GIF, WebP ou SVG (máx. 5MB).
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileChange}
            style={{ display: "block", marginBottom: 12 }}
          />
          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "white",
              border: "none",
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {uploading ? "A enviar…" : "Enviar avatar"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", color: "#b91c1c", marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, borderRadius: 8, background: "#f0fdf4", color: "#166534", marginBottom: 16 }}>
          Avatar atualizado. O boneco na página principal passa a usar esta imagem.
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 24 }}>
          <p style={{ marginBottom: 8, color: "var(--muted)" }}>Pré-visualização:</p>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={preview}
              alt="Pré-visualização"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      <section style={{ marginTop: 28, padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 22 }}>Configuração de Decadência</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Aqui podes ajustar as quedas dos status por minuto e a janela de horário com decadência reduzida (hora de Portugal).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 4 }}><span>Fome / min</span><input type="number" step="0.01" value={decayConfig.hungerDecayPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, hungerDecayPerMinute: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Energia / min</span><input type="number" step="0.01" value={decayConfig.energyDecayPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, energyDecayPerMinute: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Felicidade / min</span><input type="number" step="0.01" value={decayConfig.happinessDecayPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, happinessDecayPerMinute: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Higiene / min</span><input type="number" step="0.01" value={decayConfig.hygieneDecayPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, hygieneDecayPerMinute: Number(e.target.value) })} /></label>

          <label style={{ display: "grid", gap: 4 }}><span>Vida/min se fome=0</span><input type="number" step="0.01" value={decayConfig.lifeDecayWhenHungerZeroPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, lifeDecayWhenHungerZeroPerMinute: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Vida/min se energia=0</span><input type="number" step="0.01" value={decayConfig.lifeDecayWhenEnergyZeroPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, lifeDecayWhenEnergyZeroPerMinute: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Vida/min se higiene=0</span><input type="number" step="0.01" value={decayConfig.lifeDecayWhenHygieneZeroPerMinute} onChange={(e) => setDecayConfig({ ...decayConfig, lifeDecayWhenHygieneZeroPerMinute: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Multiplicador no horário reduzido</span><input type="number" step="0.01" value={decayConfig.lowAttentionDecayMultiplier} onChange={(e) => setDecayConfig({ ...decayConfig, lowAttentionDecayMultiplier: Number(e.target.value) })} /></label>

          <label style={{ display: "grid", gap: 4 }}><span>Início horário reduzido (0-23)</span><input type="number" min={0} max={23} value={decayConfig.lowAttentionStartHour} onChange={(e) => setDecayConfig({ ...decayConfig, lowAttentionStartHour: Number(e.target.value) })} /></label>
          <label style={{ display: "grid", gap: 4 }}><span>Fim horário reduzido (0-23)</span><input type="number" min={0} max={23} value={decayConfig.lowAttentionEndHour} onChange={(e) => setDecayConfig({ ...decayConfig, lowAttentionEndHour: Number(e.target.value) })} /></label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, gridColumn: "1 / span 2" }}>
            <input
              type="checkbox"
              checked={decayConfig.lowAttentionEnabled}
              onChange={(e) => setDecayConfig({ ...decayConfig, lowAttentionEnabled: e.target.checked })}
            />
            Ativar horário com decadência reduzida
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            onClick={saveDecaySettings}
            disabled={savingConfig}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: savingConfig ? "#9ca3af" : "#16a34a", color: "white", cursor: savingConfig ? "not-allowed" : "pointer", fontWeight: 600 }}
          >
            {savingConfig ? "A guardar..." : "Guardar decadência"}
          </button>
        </div>
      </section>
      </>
      )}
    </main>
  );
}
