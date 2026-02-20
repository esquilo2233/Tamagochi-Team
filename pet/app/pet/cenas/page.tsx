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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/pet")
      .then((r) => r.json())
      .then((p) => {
        if (p?.appearance && isAvatarPath(p.appearance)) setPreview(p.appearance);
      })
      .catch(() => {});
  }, []);

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

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
          ← Voltar ao Tamagochi
        </Link>
      </div>
      <h1 style={{ marginBottom: 8 }}>Avatar do pet</h1>
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
    </main>
  );
}
