"use client";

import Link from "next/link";
import React, { useEffect, useState, useCallback, useMemo } from "react";

interface Item {
  id: number;
  name: string;
  type: string;
  price: number;
  effect?: Record<string, number>;
}

interface Person {
  id: number;
  name: string;
  coins: number;
}

const categories = [
  { value: "all", label: "Todos", icon: "🏪" },
  { value: "comida", label: "Comidas", icon: "🍎" },
  { value: "bebida", label: "Bebidas", icon: "🥤" },
  { value: "remedio", label: "Remédios", icon: "💊" },
  { value: "higiene", label: "Higiene", icon: "🧼" },
  { value: "energia", label: "Energia", icon: "⚡" },
  { value: "felicidade", label: "Felicidade", icon: "😊" },
  { value: "especial", label: "Especiais", icon: "✨" },
];

export default function Shop() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessionPerson, setSessionPerson] = useState<Person | null>(null);
  const [buyingItemId, setBuyingItemId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      const [itemsRes, sessionRes] = await Promise.all([
        fetch("/api/shop"),
        fetch("/api/session"),
      ]);

      const [itemsData, sessionData] = await Promise.all([
        itemsRes.json(),
        sessionRes.json(),
      ]);

      setItems(Array.isArray(itemsData) ? itemsData : []);

      if (sessionData?.ok && sessionData?.person) {
        setSessionPerson({
          id: sessionData.person.id,
          name: sessionData.person.name,
          coins: sessionData.person.coins ?? 0,
        });
      } else {
        setSessionPerson(null);
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Atualizar apenas o saldo da pessoa após compra
  const updatePersonCoins = useCallback((newCoins: number) => {
    setSessionPerson((prev) => (prev ? { ...prev, coins: newCoins } : null));
  }, []);

  const buy = useCallback(
    async (itemId: number) => {
      if (!sessionPerson) {
        showNotice("❌ Entre com o seu código para comprar");
        return;
      }

      setBuyingItemId(itemId);

      try {
        const res = await fetch("/api/shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: sessionPerson.id,
            itemId,
            petId: 1,
          }),
        });

        const result = await res.json();

        if (result?.ok) {
          showNotice("✅ Compra realizada!");
          updatePersonCoins(result.person.coins);
        } else {
          showNotice("❌ " + (result?.error ?? "Erro na compra"));
        }
      } catch (e) {
        showNotice("❌ Erro de rede");
      } finally {
        setBuyingItemId(null);
        setTimeout(() => setNotice(null), 2000);
      }
    },
    [sessionPerson, updatePersonCoins],
  );

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2000);
  };

  // Filtrar itens por categoria e pesquisa
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.type === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>🏪 Loja</h2>
        <Link
          href="/"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            fontWeight: 500,
          }}
        >
          ← Voltar
        </Link>
      </div>

      {notice && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: notice.startsWith("✅")
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(245, 158, 11, 0.1)",
            color: notice.startsWith("✅") ? "#10b981" : "#f59e0b",
            border: `1px solid ${notice.startsWith("✅") ? "#10b981" : "#f59e0b"}`,
            fontWeight: 500,
          }}
        >
          {notice}
        </div>
      )}

      {sessionPerson ? (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--muted)" }}>👤</span>
          <strong style={{ color: "var(--foreground)" }}>
            {sessionPerson.name}
          </strong>
          <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 16 }}>
            🪙 {sessionPerson.coins}
          </span>
        </div>
      ) : (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#f59e0b",
          }}
        >
          ⚠️ Entre com o seu código na página principal para comprar.
        </div>
      )}

      {/* Filtros de Categoria */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              background:
                selectedCategory === cat.value
                  ? "var(--accent)"
                  : "var(--card-bg)",
              color:
                selectedCategory === cat.value ? "#fff" : "var(--foreground)",
              cursor: "pointer",
              fontWeight: selectedCategory === cat.value ? 600 : 400,
              transition: "all 0.2s ease",
              border:
                selectedCategory === cat.value
                  ? "2px solid var(--accent)"
                  : "2px solid var(--card-border)",
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Barra de Pesquisa */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Pesquisar itens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "2px solid var(--card-border)",
            background: "var(--card-bg)",
            color: "var(--foreground)",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
        />
      </div>

      {/* Grid de Itens */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {filteredItems.map((it) => {
          const isBuying = buyingItemId === it.id;
          const canAfford = sessionPerson && sessionPerson.coins >= it.price;

          return (
            <div
              key={it.id}
              style={{
                padding: 16,
                borderRadius: 12,
                background: "var(--card-bg)",
                border: "2px solid var(--card-border)",
                color: "var(--foreground)",
                transition: "transform 0.1s ease, border-color 0.2s ease",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {it.name}
              </div>
              <div
                style={{
                  color: "#fbbf24",
                  fontWeight: 600,
                  marginBottom: 8,
                  fontSize: 15,
                }}
              >
                🪙 {it.price} moedas
              </div>
              <div
                style={{
                  color: "var(--muted)",
                  marginBottom: 8,
                  fontSize: 13,
                  textTransform: "capitalize",
                }}
              >
                📦 {it.type}
              </div>
              {it.effect && typeof it.effect === "object" && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                  }}
                >
                  {it.effect.hunger && (
                    <span
                      style={{
                        background: "rgba(254, 243, 199, 0.3)",
                        color: "var(--foreground)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(254, 243, 199, 0.5)",
                      }}
                    >
                      {it.effect.hunger > 0 ? "+" : ""}
                      {it.effect.hunger} Fome
                    </span>
                  )}
                  {it.effect.energy && (
                    <span
                      style={{
                        background: "rgba(219, 234, 254, 0.3)",
                        color: "var(--foreground)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(219, 234, 254, 0.5)",
                      }}
                    >
                      {it.effect.energy > 0 ? "+" : ""}
                      {it.effect.energy} Energia
                    </span>
                  )}
                  {it.effect.happiness && (
                    <span
                      style={{
                        background: "rgba(252, 231, 243, 0.3)",
                        color: "var(--foreground)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(252, 231, 243, 0.5)",
                      }}
                    >
                      {it.effect.happiness > 0 ? "+" : ""}
                      {it.effect.happiness} Felicidade
                    </span>
                  )}
                  {it.effect.hygiene && (
                    <span
                      style={{
                        background: "rgba(209, 250, 229, 0.3)",
                        color: "var(--foreground)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(209, 250, 229, 0.5)",
                      }}
                    >
                      {it.effect.hygiene > 0 ? "+" : ""}
                      {it.effect.hygiene} Higiene
                    </span>
                  )}
                  {it.effect.life && (
                    <span
                      style={{
                        background: "rgba(254, 226, 226, 0.3)",
                        color: "var(--foreground)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(254, 226, 226, 0.5)",
                      }}
                    >
                      {it.effect.life > 0 ? "+" : ""}
                      {it.effect.life} Vida
                    </span>
                  )}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <button
                  onClick={() => buy(it.id)}
                  disabled={isBuying || !sessionPerson || !canAfford}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: isBuying
                      ? "#6b7280"
                      : !sessionPerson
                        ? "#d1d5db"
                        : !canAfford
                          ? "#d1d5db"
                          : "var(--accent)",
                    color: "white",
                    border: "none",
                    cursor:
                      isBuying || !sessionPerson || !canAfford
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 600,
                    minWidth: 100,
                    transition: "background 0.2s ease, transform 0.1s ease",
                  }}
                >
                  {isBuying ? "⏳..." : "Comprar"}
                </button>
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div
            style={{
              color: "var(--muted-2)",
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 40,
              fontSize: 16,
            }}
          >
            {searchQuery
              ? `🔍 Nenhum item encontrado para "${searchQuery}"`
              : "📦 Nenhum item disponível nesta categoria."}
          </div>
        )}
      </div>
    </div>
  );
}
