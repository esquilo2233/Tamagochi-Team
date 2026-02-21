"use client";

import Link from "next/link";
import React, { FormEvent, useState } from "react";

const ITEM_TYPES = [
  { value: "food", label: "Alimento" },
  { value: "remedy", label: "Remédio" },
  { value: "hygiene", label: "Higiene" },
  { value: "energy", label: "Energia" },
  { value: "custom", label: "Outro" },
];

export default function CreateShopItemPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("food");
  const [price, setPrice] = useState(10);
  const [hunger, setHunger] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [happiness, setHappiness] = useState(0);
  const [hygiene, setHygiene] = useState(0);
  const [life, setLife] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!name.trim()) {
      setError("Indica um nome para o item.");
      return;
    }

    const effect: Record<string, number> = {};
    if (hunger !== 0) effect.hunger = Number(hunger);
    if (energy !== 0) effect.energy = Number(energy);
    if (happiness !== 0) effect.happiness = Number(happiness);
    if (hygiene !== 0) effect.hygiene = Number(hygiene);
    if (life !== 0) effect.life = Number(life);

    if (Object.keys(effect).length === 0) {
      setError("Define pelo menos um efeito (ex: +10 fome ou +5 energia).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          price: Number(price),
          effect,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Não foi possível criar o item.");
        return;
      }

      setNotice("Item criado com sucesso!");
      setName("");
      setPrice(10);
      setHunger(0);
      setEnergy(0);
      setHappiness(0);
      setHygiene(0);
      setLife(0);
    } catch {
      setError("Erro de rede ao criar item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Criar item para o Samurai</h2>
        <Link href="/shop" style={{ color: "#0984e3", textDecoration: "none", fontWeight: 600 }}>
          Voltar à loja
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 10, padding: 16, display: "grid", gap: 12 }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          Preenche cada campo com cuidado: o preço define o custo e os efeitos definem como o item altera os stats do Samurai.
        </p>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nome do item</span>
          <small style={{ color: "var(--muted)", fontSize: 12 }}>Nome que aparece na loja e no inventário.</small>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maçã dourada / Kit médico"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Tipo de item</span>
          <small style={{ color: "var(--muted)", fontSize: 12 }}>Categoria para organizar o item (alimento, remédio, etc.).</small>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-text)" }}
          >
            {ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Preço (moedas)</span>
          <small style={{ color: "var(--muted)", fontSize: 12 }}>Quantidade de moedas necessária para comprar o item.</small>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Efeito Fome</span>
            <small style={{ color: "var(--muted)", fontSize: 12 }}>Valor positivo aumenta, negativo diminui.</small>
            <input
              type="number"
              min={-100}
              max={100}
              value={hunger}
              onChange={(e) => setHunger(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Efeito Energia</span>
            <small style={{ color: "var(--muted)", fontSize: 12 }}>Valor positivo aumenta, negativo diminui.</small>
            <input
              type="number"
              min={-100}
              max={100}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Efeito Felicidade</span>
            <small style={{ color: "var(--muted)", fontSize: 12 }}>Valor positivo aumenta, negativo diminui.</small>
            <input
              type="number"
              min={-100}
              max={100}
              value={happiness}
              onChange={(e) => setHappiness(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Efeito Higiene</span>
            <small style={{ color: "var(--muted)", fontSize: 12 }}>Valor positivo aumenta, negativo diminui.</small>
            <input
              type="number"
              min={-100}
              max={100}
              value={hygiene}
              onChange={(e) => setHygiene(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Efeito Vida</span>
            <small style={{ color: "var(--muted)", fontSize: 12 }}>Valor positivo aumenta, negativo diminui.</small>
            <input
              type="number"
              min={-100}
              max={100}
              value={life}
              onChange={(e) => setLife(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </label>
        </div>

        {notice && <div style={{ padding: 10, borderRadius: 8, background: "#e6fffa", color: "#065f46" }}>{notice}</div>}
        {error && <div style={{ padding: 10, borderRadius: 8, background: "#fee2e2", color: "#991b1b" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              background: loading ? "#9ca3af" : "#16a34a",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "A criar..." : "Criar item"}
          </button>
        </div>
      </form>
    </main>
  );
}