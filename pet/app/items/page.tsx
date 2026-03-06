"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAdminAccess } from "@/lib/useAdminAccess";

type Effect = {
  hunger?: number;
  energy?: number;
  happiness?: number;
  hygiene?: number;
  life?: number;
};

const EMPTY_FORM = {
  id: null as number | null,
  name: "",
  type: "food",
  price: 0,
  hunger: 0,
  energy: 0,
  happiness: 0,
  hygiene: 0,
  life: 0,
};

export default function ItemsPage() {
  const { hasAccess, checkingAccess } = useAdminAccess();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEditing = useMemo(() => form.id !== null, [form.id]);

  // Mostrar loading enquanto verifica permissões
  if (checkingAccess) {
    return (
      <main style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
        <div
          style={{ padding: 16, borderRadius: 8, background: "var(--card-bg)" }}
        >
          A verificar permissões...
        </div>
      </main>
    );
  }

  // Negar acesso se não for admin/gestor
  if (!hasAccess) {
    return (
      <main style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/admin"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >
            ← Voltar ao Admin
          </Link>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            background: "#fff3cd",
            color: "#856404",
          }}
        >
          Sem permissão para aceder à gestão de itens. Apenas{" "}
          <strong>admin</strong> e <strong>gestor</strong>.
        </div>
      </main>
    );
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setNotice("Erro ao carregar itens");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function mapEffectFromForm(): Effect {
    const effect: Effect = {};
    if (form.hunger !== 0) effect.hunger = Number(form.hunger);
    if (form.energy !== 0) effect.energy = Number(form.energy);
    if (form.happiness !== 0) effect.happiness = Number(form.happiness);
    if (form.hygiene !== 0) effect.hygiene = Number(form.hygiene);
    if (form.life !== 0) effect.life = Number(form.life);
    return effect;
  }

  async function saveItem() {
    if (!form.name.trim()) {
      setNotice("Nome é obrigatório");
      return;
    }
    const effect = mapEffectFromForm();
    if (Object.keys(effect).length === 0) {
      setNotice("Define pelo menos 1 efeito");
      return;
    }

    setLoading(true);
    try {
      const endpoint = "/api/items";
      const method = isEditing ? "PUT" : "POST";
      const payload = {
        ...(isEditing && { id: form.id }),
        name: form.name.trim(),
        type: form.type,
        price: Number(form.price),
        effect,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setNotice(data?.error ?? "Erro ao guardar item");
        return;
      }

      setNotice(isEditing ? "Item atualizado" : "Item criado");
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setNotice("Erro de rede");
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(null), 2200);
    }
  }

  async function removeItem(id: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setNotice(data?.error ?? "Erro ao eliminar");
        return;
      }
      setNotice("Item eliminado");
      if (form.id === id) setForm(EMPTY_FORM);
      await load();
    } catch {
      setNotice("Erro de rede");
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(null), 2200);
    }
  }

  function startEdit(it: any) {
    const e = (it.effect ?? {}) as Effect;
    setForm({
      id: it.id,
      name: it.name ?? "",
      type: it.type ?? "food",
      price: Number(it.price ?? 0),
      hunger: Number(e.hunger ?? 0),
      energy: Number(e.energy ?? 0),
      happiness: Number(e.happiness ?? 0),
      hygiene: Number(e.hygiene ?? 0),
      life: Number(e.life ?? 0),
    });
  }

  return (
    <main style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/admin"
          style={{ color: "var(--accent)", textDecoration: "underline" }}
        >
          ← Voltar ao Admin
        </Link>
      </div>

      <h2 style={{ marginTop: 0 }}>Gestão de Itens</h2>
      {notice && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            borderRadius: 6,
            background: "#e6fffa",
            color: "#065f46",
          }}
        >
          {notice}
        </div>
      )}

      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 13 }}>
          Preenche os campos abaixo para criar/editar um item. Valores positivos
          aumentam stats, negativos reduzem.
        </p>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Nome</span>
            <small style={fieldHelpStyle}>
              Nome visível na loja/inventário.
            </small>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Kit Médico"
              style={inputStyle}
            />
          </label>
          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Preço</span>
            <small style={fieldHelpStyle}>Custo em moedas para comprar.</small>
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              placeholder="Ex: 30"
              style={inputStyle}
            />
          </label>

          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Tipo</span>
            <small style={fieldHelpStyle}>
              Categoria usada para organização.
            </small>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={inputStyle}
            >
              <option value="food">Alimento</option>
              <option value="remedy">Remédio</option>
              <option value="hygiene">Higiene</option>
              <option value="energy">Energia</option>
              <option value="custom">Outro</option>
            </select>
          </label>
          <div />

          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Efeito Fome</span>
            <small style={fieldHelpStyle}>Quanto altera a fome.</small>
            <input
              type="number"
              value={form.hunger}
              onChange={(e) =>
                setForm({ ...form, hunger: Number(e.target.value) })
              }
              placeholder="Ex: +15"
              style={inputStyle}
            />
          </label>
          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Efeito Energia</span>
            <small style={fieldHelpStyle}>Quanto altera a energia.</small>
            <input
              type="number"
              value={form.energy}
              onChange={(e) =>
                setForm({ ...form, energy: Number(e.target.value) })
              }
              placeholder="Ex: +10"
              style={inputStyle}
            />
          </label>
          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Efeito Felicidade</span>
            <small style={fieldHelpStyle}>Quanto altera a felicidade.</small>
            <input
              type="number"
              value={form.happiness}
              onChange={(e) =>
                setForm({ ...form, happiness: Number(e.target.value) })
              }
              placeholder="Ex: +5"
              style={inputStyle}
            />
          </label>
          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Efeito Higiene</span>
            <small style={fieldHelpStyle}>Quanto altera a higiene.</small>
            <input
              type="number"
              value={form.hygiene}
              onChange={(e) =>
                setForm({ ...form, hygiene: Number(e.target.value) })
              }
              placeholder="Ex: +20"
              style={inputStyle}
            />
          </label>
          <label style={fieldWrapStyle}>
            <span style={fieldLabelStyle}>Efeito Vida</span>
            <small style={fieldHelpStyle}>Quanto altera a vida.</small>
            <input
              type="number"
              value={form.life}
              onChange={(e) =>
                setForm({ ...form, life: Number(e.target.value) })
              }
              placeholder="Ex: +8"
              style={inputStyle}
            />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 10,
          }}
        >
          {isEditing && (
            <button onClick={() => setForm(EMPTY_FORM)} style={btn("#95a5a6")}>
              Cancelar
            </button>
          )}
          <button onClick={saveItem} disabled={loading} style={btn("#16a34a")}>
            {isEditing ? "Atualizar" : "Criar"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              border: "1px solid var(--card-border)",
              borderRadius: 8,
              padding: 10,
              background: "var(--card-bg)",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {it.name} — {it.price} moedas
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{it.type}</div>
            {it.effect && (
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}
              >
                {it.effect.hunger
                  ? `Fome ${it.effect.hunger > 0 ? "+" : ""}${it.effect.hunger} `
                  : ""}
                {it.effect.energy
                  ? `Energia ${it.effect.energy > 0 ? "+" : ""}${it.effect.energy} `
                  : ""}
                {it.effect.happiness
                  ? `Felicidade ${it.effect.happiness > 0 ? "+" : ""}${it.effect.happiness} `
                  : ""}
                {it.effect.hygiene
                  ? `Higiene ${it.effect.hygiene > 0 ? "+" : ""}${it.effect.hygiene} `
                  : ""}
                {it.effect.life
                  ? `Vida ${it.effect.life > 0 ? "+" : ""}${it.effect.life}`
                  : ""}
              </div>
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button onClick={() => startEdit(it)} style={btn("#0984e3")}>
                Editar
              </button>
              <button onClick={() => removeItem(it.id)} style={btn("#d63031")}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ color: "var(--muted)" }}>Sem itens.</div>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--input-text)",
};

const fieldWrapStyle: React.CSSProperties = { display: "grid", gap: 4 };
const fieldLabelStyle: React.CSSProperties = { fontWeight: 600, fontSize: 13 };
const fieldHelpStyle: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: 12,
};

function btn(background: string): React.CSSProperties {
  return {
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background,
    color: "white",
    cursor: "pointer",
  };
}
