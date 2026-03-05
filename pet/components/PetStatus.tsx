"use client";

import React, { useEffect, useState } from "react";
import TopPeople from "./TopPeople";
import TopTime from "./TopTime";
import PetCompanion from "./PetCompanion";
import MinigamesModal from "./MinigamesModal";
import Link from "next/link";
import Image from "next/image";
import { getEncryptedItem, setEncryptedItem } from "@/lib/encryptedStorage";

type Stats = {
  hunger: number;
  energy: number;
  happiness: number;
  hygiene: number;
  life: number;
  coins?: number;
};

const STORAGE_KEY = "samurai_state";

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export default function PetStatus() {
  const [stats, setStats] = useState<Stats>({
    hunger: 100,
    energy: 100,
    happiness: 100,
    hygiene: 100,
    life: 100,
    coins: 0,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPetting, setIsPetting] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);
  const nextParticleId = React.useRef(1);
  const petRef = React.useRef<HTMLDivElement | null>(null);
  const [showMinigames, setShowMinigames] = useState(false);
  const [showFoodShop, setShowFoodShop] = useState(false);
  const [foodItems, setFoodItems] = useState<Array<any>>([]);
  const [foodFilter, setFoodFilter] = useState<string>("all");
  const [foodSearch, setFoodSearch] = useState<string>("");

  const [petId, setPetId] = useState<number | null>(null);
  const [petAvatarUrl, setPetAvatarUrl] = useState<string | null>(null);
  const [peopleList, setPeopleList] = useState<Array<any>>([]);
  const [currentPersonId, setCurrentPersonId] = useState<number | null>(null);
  const [currentPersonCoins, setCurrentPersonCoins] = useState<number>(0);
  const [companionCode, setCompanionCode] = useState("");
  const [companionWindow, setCompanionWindow] = useState<Window | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [showCleaning, setShowCleaning] = useState(false);
  const [cleanClicks, setCleanClicks] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerCode, setRegisterCode] = useState<string | null>(null);

  function loadPet() {
    fetch("/api/pet")
      .then((r) => r.json())
      .then((p) => {
        if (p && p.id) {
          setPetId(p.id);
          setStats({
            hunger: p.hunger ?? 100,
            energy: p.energy ?? 100,
            happiness: p.happiness ?? 100,
            hygiene: p.hygiene ?? 100,
            life: p.life ?? 100,
            coins: 0,
          });
          setIsSleeping(
            !!(p as { sleepStartedAt?: string | null }).sleepStartedAt,
          );
          if (typeof p.appearance === "string" && p.appearance) {
            // Se for URL completa (Vercel Blob) ou caminho relativo
            if (p.appearance.startsWith("http")) {
              // URL completa do Vercel Blob
              setPetAvatarUrl(p.appearance);
            } else if (p.appearance.startsWith("/")) {
              // Caminho relativo (fallback para desenvolvimento local)
              setPetAvatarUrl(p.appearance + "?t=" + Date.now());
            } else {
              setPetAvatarUrl("/avatars/avatar-1771607858061.jpg");
            }
          } else {
            setPetAvatarUrl("/avatars/avatar-1771607858061.jpg");
          }
        }
      })
      .catch(() => {
        // fallback to encrypted localStorage
        const parsed = getEncryptedItem<Stats>(STORAGE_KEY, null);
        if (parsed) {
          setStats(parsed);
        }
        // Set default avatar on error
        setPetAvatarUrl("/avatars/avatar-1771607858061.jpg");
      });
  }

  useEffect(() => {
    // fetch pet from server
    let mounted = true;
    loadPet();

    // Atualizar quando a página ganha foco (usuário volta de outra página)
    const handleFocus = () => {
      if (mounted) loadPet();
    };
    window.addEventListener("focus", handleFocus);

    // Atualizar stats automaticamente a cada minuto (ou 15s quando a dormir)
    const interval = setInterval(() => {
      if (mounted) loadPet();
    }, 15000); // 15s para ver recuperação durante o sono; loadPet atualiza isSleeping

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let sessionFound = false;
    async function init() {
      // Primeiro verificar sessão (cookie)
      const sessionRes = await fetch("/api/session");
      const sessionJson = await sessionRes.json();
      if (mounted && sessionJson?.ok && sessionJson?.person) {
        sessionFound = true;
        setHasSession(true);
        setCurrentPersonId(sessionJson.person.id);
        setCurrentPersonCoins(sessionJson.person.coins ?? 0);
        setCompanionCode(sessionJson.person.code ?? "");
      }
      // Carregar lista de pessoas
      const peopleRes = await fetch("/api/people");
      const peopleJson = await peopleRes.json();
      if (!mounted) return;
      setPeopleList(Array.isArray(peopleJson) ? peopleJson : []);
      // Sem sessão: não atribuir pessoa (moedas não vão para ninguém)
      if (!sessionFound) setHasSession(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (currentPersonId == null) return;
    // fetch person details to update coins
    fetch(`/api/people`)
      .then((r) => r.json())
      .then((j) => {
        const p = Array.isArray(j)
          ? j.find((x: any) => x.id === currentPersonId)
          : null;
        if (p) setCurrentPersonCoins(p.coins ?? 0);
      })
      .catch(() => {});
  }, [currentPersonId]);

  useEffect(() => {
    // Carregar inventário de comida (apenas itens comprados)
    fetch("/api/pet/inventory")
      .then((r) => r.json())
      .then((items) => {
        setFoodItems(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // keep encrypted local copy in case offline
    setEncryptedItem(STORAGE_KEY, stats);
  }, [stats]);

  useEffect(() => {
    if (!showCleaning) return;
    const handleMove = (e: MouseEvent) =>
      setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [showCleaning]);

  async function apply(delta: Partial<Stats>, msg?: string) {
    // optimistic UI update
    setStats((s) => {
      const next: Stats = {
        hunger: clamp((s.hunger ?? 0) + (delta.hunger ?? 0)),
        energy: clamp((s.energy ?? 0) + (delta.energy ?? 0)),
        happiness: clamp((s.happiness ?? 0) + (delta.happiness ?? 0)),
        hygiene: clamp((s.hygiene ?? 0) + (delta.hygiene ?? 0)),
        life: clamp((s.life ?? 0) + (delta.life ?? 0)),
      };
      return next;
    });

    try {
      const res = await fetch("/api/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ effect: delta }),
      });
      const updated = await res.json();
      if (updated && updated.id) {
        setStats({
          hunger: updated.hunger ?? 100,
          energy: updated.energy ?? 100,
          happiness: updated.happiness ?? 100,
          hygiene: updated.hygiene ?? 100,
          life: updated.life ?? 100,
          coins: updated.coins ?? stats.coins,
        });
        setPetId(updated.id ?? petId);
      }
    } catch (e) {
      // ignore network errors
    }

    if (msg) {
      setMessage(msg);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  async function handleSamuraiClick() {
    if (showCleaning) {
      setCleanClicks((c) => {
        const next = c + 1;
        if (next >= 5) {
          setShowCleaning(false);
          setCleanClicks(0);
          apply({ hygiene: 30, happiness: 5 }, "Limpo e cheiroso!");
          return 0;
        }
        return next;
      });
      return;
    }

    // Apenas animação e felicidade ao clicar
    apply({ happiness: 5 }, "Acariciado!");

    // Animação de petting
    setIsPetting(true);
    setTimeout(() => setIsPetting(false), 350);

    // Spawn particles
    const id = nextParticleId.current++;
    const left = 50 + (Math.random() - 0.5) * 80;
    const emojis = ["💖", "✨", "💫", "🌟", "🎉", "⚔️", "🗾"];
    setParticles((p) => [
      ...p,
      { id, left, emoji: emojis[Math.floor(Math.random() * emojis.length)] },
    ]);
    setTimeout(() => setParticles((p) => p.filter((x) => x.id !== id)), 900);
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "24px",
        boxSizing: "border-box",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {!hasSession && (
        <button
          onClick={() => {
            setRegisterName("");
            setRegisterCode(null);
            setShowRegisterModal(true);
          }}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1100,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            color: "var(--muted)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
            opacity: 0.92,
          }}
        >
          Registar
        </button>
      )}

      <style>{`
        @keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes floatUp { 0%{opacity:1; transform: translateY(0) scale(1)} 100%{opacity:0; transform: translateY(-120px) scale(1.1)} }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.3), 0 0 40px rgba(255, 107, 107, 0.2); } 50% { box-shadow: 0 0 30px rgba(255, 107, 107, 0.5), 0 0 60px rgba(255, 107, 107, 0.3); } }
        @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.4)); } 50% { filter: drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes opacityPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>

      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Coluna esquerda: Top People e Top Time */}
        <aside style={{ width: 280, flexShrink: 0 }}>
          <TopPeople />
          <TopTime />
        </aside>

        {/* Coluna central: Pet e controles */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: 24,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                ref={petRef}
                role="button"
                tabIndex={0}
                onClick={handleSamuraiClick}
                style={{
                  width: 280,
                  height: 350,
                  borderRadius: 24,
                  background: `linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%)`,
                  backgroundSize: "200% 200%",
                  boxShadow:
                    "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 30px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  position: "relative",
                  cursor: "pointer",
                  transform: isPetting ? "scale(1.08)" : "scale(1)",
                  transition:
                    "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  outline: "none",
                  border: "3px solid rgba(0, 0, 0, 0.1)",
                  animation:
                    "pulse 3s ease-in-out infinite, float 4s ease-in-out infinite",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isPetting) {
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                {/* Background glow effect */}
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                    animation: "float 6s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    background: "transparent",
                    borderRadius: "0",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                    border: "none",
                  }}
                >
                  {isSleeping && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(100, 100, 150, 0.15)",
                        borderRadius: 24,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        paddingTop: 20,
                        zIndex: 5,
                        pointerEvents: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 28,
                          animation: "opacityPulse 1.5s ease-in-out infinite",
                        }}
                      >
                        💤 zzz
                      </span>
                    </div>
                  )}
                  {/* Sujidades - aparecem quando higiene desce */}
                  {!isSleeping &&
                    (() => {
                      const dirtIntensity = Math.max(
                        0,
                        (100 - stats.hygiene) / 100,
                      );
                      const spots = [
                        { left: "15%", top: "20%", size: 35 },
                        { left: "60%", top: "15%", size: 28 },
                        { left: "75%", top: "45%", size: 40 },
                        { left: "25%", top: "55%", size: 30 },
                        { left: "50%", top: "70%", size: 25 },
                        { left: "35%", top: "35%", size: 22 },
                      ];
                      return spots.map((s, i) => (
                        <div
                          key={i}
                          style={{
                            position: "absolute",
                            left: s.left,
                            top: s.top,
                            width: s.size,
                            height: s.size,
                            borderRadius: "50%",
                            background:
                              "radial-gradient(circle, rgba(80,60,40,0.6) 0%, rgba(60,45,30,0.4) 50%, transparent 70%)",
                            opacity: dirtIntensity * 0.9,
                            pointerEvents: "none",
                            zIndex: 4,
                          }}
                        />
                      ));
                    })()}
                  <Image
                    src={petAvatarUrl || "/avatars/avatar-1771607858061.jpg"}
                    alt="Avatar do Samurai"
                    key={petAvatarUrl || "default"}
                    width={400}
                    height={500}
                    onError={(e) => {
                      // Fallback para avatar local se a imagem do blob falhar
                      const target = e.target as HTMLImageElement;
                      const fallbackSrc = "/avatars/avatar-1771607858061.jpg";
                      if (
                        target.src !== fallbackSrc &&
                        target.src !== `${window.location.origin}${fallbackSrc}`
                      ) {
                        target.src = fallbackSrc;
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: isSleeping
                        ? "drop-shadow(0 4px 12px rgba(0,0,0,0.2)) brightness(0.85)"
                        : "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
                      animation: isSleeping
                        ? "none"
                        : "glow 2s ease-in-out infinite",
                      transition: "transform 200ms ease, filter 300ms ease",
                    }}
                  />
                </div>

                {/* particles */}
                {particles.map((pt) => (
                  <div
                    key={pt.id}
                    style={{
                      position: "absolute",
                      left: `calc(${pt.left}% )`,
                      bottom: 30,
                      pointerEvents: "none",
                      animation: "floatUp 900ms linear forwards",
                      fontSize: 24,
                      zIndex: 10,
                    }}
                  >
                    {pt.emoji}
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  color: "var(--foreground)",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                Samurai{" "}
                {isSleeping && (
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}
                  >
                    😴 a dormir
                  </span>
                )}
              </div>
              <div style={{ marginTop: 4, color: "var(--foreground)" }}>
                Felicidade: <strong>{stats.happiness}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita: Stats e ações */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Stat label="Fome" value={stats.hunger} color="#ff6b6b" />
            <Stat label="Energia" value={stats.energy} color="#f6b93b" />
            <Stat label="Higiene" value={stats.hygiene} color="#4ecdc4" />
            <Stat label="Vida" value={stats.life} color="#6a89cc" />

            <div style={{ marginBottom: 12 }}>
              {hasSession ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!companionCode || companionCode.length !== 6) return;
                      const width = 250;
                      const height = 380;
                      const left = window.screen.width - width - 20;
                      const top = 20;
                      const popup = window.open(
                        `/companion?code=${encodeURIComponent(companionCode)}`,
                        "petCompanion",
                        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no`,
                      );
                      if (popup) setCompanionWindow(popup);
                    }}
                    style={btnStyle("#e74c3c")}
                  >
                    Fazer Companhia
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch("/api/session", { method: "DELETE" });
                        setHasSession(false);
                        setCurrentPersonId(null);
                        setCurrentPersonCoins(0);
                        setCompanionCode("");
                        setMessage("Sessão terminada");
                        setTimeout(() => setMessage(null), 2500);
                      } catch (e) {
                        setMessage("Erro ao sair");
                        setTimeout(() => setMessage(null), 2500);
                      }
                    }}
                    style={btnStyle("#95a5a6")}
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const code = companionCode.trim().toUpperCase();
                    if (!code || code.length !== 6) {
                      setMessage("Código inválido. Use 6 caracteres.");
                      setTimeout(() => setMessage(null), 2500);
                      return;
                    }
                    try {
                      const res = await fetch("/api/session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code }),
                      });
                      const j = await res.json();
                      if (j?.ok) {
                        setHasSession(true);
                        setCurrentPersonId(j.person.id);
                        setCurrentPersonCoins(j.person.coins ?? 0);
                        setCompanionCode(j.person.code ?? "");
                        setMessage(`Sessão iniciada: ${j.person.name}`);
                        setTimeout(() => setMessage(null), 2500);
                      } else {
                        setMessage(j?.error || "Código não encontrado");
                        setTimeout(() => setMessage(null), 2500);
                      }
                    } catch (err) {
                      setMessage("Erro de rede");
                      setTimeout(() => setMessage(null), 2500);
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="text"
                      value={companionCode}
                      onChange={(e) =>
                        setCompanionCode(e.target.value.toUpperCase())
                      }
                      placeholder="Código (ABC123)"
                      maxLength={6}
                      style={{
                        flex: "0 0 120px",
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--card-border)",
                        fontSize: 13,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontFamily: "monospace",
                      }}
                    />
                    <button type="submit" style={btnStyle("#2ecc71")}>
                      Entrar
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowFoodShop(true)}
                style={btnStyle("#4CAF50")}
              >
                🎒 Inventário
              </button>

              <button
                onClick={() => setShowMinigames(true)}
                style={btnStyle("#8e44ad")}
              >
                🎮 Brincar com o Samurai
              </button>

              <button
                onClick={async () => {
                  if (isSleeping) return;
                  try {
                    const res = await fetch("/api/pet?action=sleep", {
                      method: "POST",
                    });
                    const p = await res.json();
                    if (p?.id) {
                      setIsSleeping(true);
                      setStats({
                        hunger: p.hunger ?? stats.hunger,
                        energy: p.energy ?? stats.energy,
                        happiness: p.happiness ?? stats.happiness,
                        hygiene: p.hygiene ?? stats.hygiene,
                        life: p.life ?? stats.life,
                        coins: 0,
                      });
                      setMessage("A dormir... os stats vão subir aos poucos");
                      setTimeout(() => setMessage(null), 3000);
                    }
                  } catch (e) {
                    setMessage("Erro ao adormecer");
                    setTimeout(() => setMessage(null), 2500);
                  }
                }}
                disabled={isSleeping}
                style={btnStyle(isSleeping ? "#95a5a6" : "#FF9800")}
              >
                {isSleeping ? "😴 A dormir..." : "Dormir"}
              </button>

              <button
                onClick={() => {
                  if (showCleaning) {
                    setShowCleaning(false);
                    setCleanClicks(0);
                    setMessage(null);
                    return;
                  }
                  setShowCleaning(true);
                  setCleanClicks(0);
                  setMessage(
                    "Clique no Samurai 5 vezes com a esponja para limpar",
                  );
                  setTimeout(() => setMessage(null), 3000);
                }}
                style={btnStyle(showCleaning ? "#95a5a6" : "#34B3A0")}
              >
                {showCleaning
                  ? `🧽 ${cleanClicks}/5 (clique para cancelar)`
                  : "Limpar"}
              </button>

              <Link href="/shop">
                <button style={btnStyle("#0984e3")}>🛒 Loja</button>
              </Link>
            </div>

            {message && (
              <div
                style={{
                  marginTop: 16,
                  color: "var(--foreground)",
                  padding: 12,
                  background: "var(--card-border)",
                  borderRadius: 8,
                }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Esponja que segue o cursor ao limpar */}
      {showCleaning && (
        <div
          style={{
            position: "fixed",
            left: mousePos.x,
            top: mousePos.y,
            width: 48,
            height: 48,
            marginLeft: -24,
            marginTop: -24,
            pointerEvents: "none",
            zIndex: 9999,
            fontSize: 40,
            transform: "rotate(-15deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        >
          🧽
        </div>
      )}

      {!hasSession && showRegisterModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: 420,
              background: "var(--card-bg)",
              color: "var(--foreground)",
              borderRadius: 14,
              padding: 18,
              border: "1px solid var(--card-border)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Registar pessoa</h3>
            <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 13 }}>
              Introduz apenas o nome. Vais receber um código para guardar.
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              <input
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Nome"
              />

              <button
                disabled={registerLoading || !registerName.trim()}
                onClick={async () => {
                  setRegisterLoading(true);
                  setMessage(null);
                  try {
                    const res = await fetch("/api/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: registerName.trim() }),
                    });
                    const j = await res.json();
                    if (!res.ok || !j?.ok) {
                      setMessage(j?.error || "Erro ao registar");
                      return;
                    }
                    setRegisterCode(j.person?.code ?? null);
                  } catch {
                    setMessage("Erro de rede ao registar");
                  } finally {
                    setRegisterLoading(false);
                  }
                }}
                style={btnStyle(registerLoading ? "#9ca3af" : "#16a34a")}
              >
                {registerLoading ? "A registar..." : "Registar"}
              </button>

              {registerCode && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 8,
                    background: "#ecfeff",
                    color: "#155e75",
                  }}
                >
                  Código gerado:{" "}
                  <strong
                    style={{ letterSpacing: 1.2, fontFamily: "monospace" }}
                  >
                    {registerCode}
                  </strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Guarda este código para entrar depois.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Minijogos */}
      <MinigamesModal
        isOpen={showMinigames}
        onClose={() => setShowMinigames(false)}
        personId={hasSession ? (currentPersonId ?? undefined) : undefined}
        onGameFinish={async () => {
          await loadPet();
          if (currentPersonId) {
            const p = await fetch("/api/people").then((r) => r.json());
            const found = Array.isArray(p)
              ? p.find((x: any) => x.id === currentPersonId)
              : null;
            if (found) setCurrentPersonCoins(found.coins ?? 0);
          }
        }}
      />

      {/* Modal de Itens (inventário comprado) */}
      {showFoodShop && (
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
          onClick={() => setShowFoodShop(false)}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
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
              <h3 style={{ margin: 0 }}>🎒 Inventário</h3>
              <button
                onClick={() => setShowFoodShop(false)}
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

            {/* Filtros do Inventário */}
            <div style={{ marginBottom: 16 }}>
              {/* Pesquisa */}
              <input
                type="text"
                placeholder="🔍 Pesquisar itens..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "2px solid var(--card-border)",
                  background: "var(--card-bg)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  marginBottom: 12,
                  outline: "none",
                }}
              />

              {/* Filtros por tipo */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { value: "all", label: "Todos", icon: "🎒" },
                  { value: "comida", label: "Comida", icon: "🍎" },
                  { value: "bebida", label: "Bebida", icon: "🥤" },
                  { value: "remedio", label: "Remédio", icon: "💊" },
                  { value: "higiene", label: "Higiene", icon: "🧼" },
                  { value: "energia", label: "Energia", icon: "⚡" },
                  { value: "felicidade", label: "Felicidade", icon: "😊" },
                  { value: "especial", label: "Especial", icon: "✨" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFoodFilter(filter.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 16,
                      border:
                        foodFilter === filter.value
                          ? "2px solid var(--accent)"
                          : "2px solid var(--card-border)",
                      background:
                        foodFilter === filter.value
                          ? "var(--accent)"
                          : "var(--card-bg)",
                      color:
                        foodFilter === filter.value
                          ? "#fff"
                          : "var(--foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: foodFilter === filter.value ? 600 : 400,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de itens filtrados */}
            {(() => {
              const filteredFoodItems = foodItems.filter((item: any) => {
                const matchesType =
                  foodFilter === "all" || item.type === foodFilter;
                const matchesSearch =
                  foodSearch === "" ||
                  item.name.toLowerCase().includes(foodSearch.toLowerCase());
                return matchesType && matchesSearch && (item.quantity ?? 0) > 0;
              });

              if (filteredFoodItems.length === 0) {
                return (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--muted)",
                    }}
                  >
                    {foodSearch || foodFilter !== "all"
                      ? "🔍 Nenhum item encontrado com estes filtros."
                      : "📦 Inventário vazio."}
                  </div>
                );
              }

              return (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {filteredFoodItems.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: "var(--background)",
                        border: "1px solid var(--card-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          Tipo: <strong>{String(item.type ?? "item")}</strong>
                        </div>
                        {item.effect && typeof item.effect === "object" && (
                          <div
                            style={{
                              fontSize: 11,
                              marginTop: 6,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                            }}
                          >
                            {item.effect.hunger && (
                              <span
                                style={{
                                  background: "rgba(254, 243, 199, 0.3)",
                                  color: "var(--foreground)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(254, 243, 199, 0.5)",
                                }}
                              >
                                +{item.effect.hunger} Fome
                              </span>
                            )}
                            {item.effect.energy && (
                              <span
                                style={{
                                  background: "rgba(219, 234, 254, 0.3)",
                                  color: "var(--foreground)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(219, 234, 254, 0.5)",
                                }}
                              >
                                +{item.effect.energy} Energia
                              </span>
                            )}
                            {item.effect.happiness && (
                              <span
                                style={{
                                  background: "rgba(252, 231, 243, 0.3)",
                                  color: "var(--foreground)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(252, 231, 243, 0.5)",
                                }}
                              >
                                +{item.effect.happiness} Felicidade
                              </span>
                            )}
                            {item.effect.hygiene && (
                              <span
                                style={{
                                  background: "rgba(209, 250, 229, 0.3)",
                                  color: "var(--foreground)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(209, 250, 229, 0.5)",
                                }}
                              >
                                +{item.effect.hygiene} Higiene
                              </span>
                            )}
                            {item.effect.life && (
                              <span
                                style={{
                                  background: "rgba(254, 226, 226, 0.3)",
                                  color: "var(--foreground)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(254, 226, 226, 0.5)",
                                }}
                              >
                                +{item.effect.life} Vida
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          x{item.quantity ?? 0}
                        </span>
                        <button
                          onClick={async () => {
                            // Optimistic UI update
                            setFoodItems((prev) =>
                              prev
                                .map((it) =>
                                  it.id === item.id
                                    ? {
                                        ...it,
                                        quantity: (it.quantity ?? 0) - 1,
                                      }
                                    : it,
                                )
                                .filter((it) => (it.quantity ?? 0) > 0),
                            );

                            // Aplicar efeito imediatamente
                            if (item.effect) {
                              setStats((s) => ({
                                ...s,
                                hunger: clamp(
                                  (s.hunger ?? 0) + (item.effect?.hunger ?? 0),
                                ),
                                energy: clamp(
                                  (s.energy ?? 0) + (item.effect?.energy ?? 0),
                                ),
                                happiness: clamp(
                                  (s.happiness ?? 0) +
                                    (item.effect?.happiness ?? 0),
                                ),
                                hygiene: clamp(
                                  (s.hygiene ?? 0) +
                                    (item.effect?.hygiene ?? 0),
                                ),
                                life: clamp(
                                  (s.life ?? 0) + (item.effect?.life ?? 0),
                                ),
                              }));
                            }

                            setMessage(`🔄 A usar ${item.name}...`);

                            try {
                              const res = await fetch("/api/pet", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  consumeItemId: item.id,
                                }),
                              });
                              const j = await res.json();

                              if (res.ok && j?.id) {
                                setMessage(`✅ ${item.name} usado!`);
                                // Atualizar stats do servidor
                                setStats({
                                  hunger: j.hunger ?? stats.hunger,
                                  energy: j.energy ?? stats.energy,
                                  happiness: j.happiness ?? stats.happiness,
                                  hygiene: j.hygiene ?? stats.hygiene,
                                  life: j.life ?? stats.life,
                                  coins: j.coins ?? stats.coins,
                                });
                                // Recarregar apenas inventory
                                const inv = await fetch(
                                  "/api/pet/inventory",
                                ).then((r) => r.json());
                                setFoodItems(Array.isArray(inv) ? inv : []);
                              } else {
                                // Revert optimistic update on error
                                setFoodItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? {
                                          ...it,
                                          quantity: (it.quantity ?? 0) + 1,
                                        }
                                      : it,
                                  ),
                                );
                                setMessage(
                                  "❌ " + (j?.error || "item indisponível"),
                                );
                              }
                              setTimeout(() => setMessage(null), 2000);
                            } catch (e) {
                              // Revert optimistic update on error
                              setFoodItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? {
                                        ...it,
                                        quantity: (it.quantity ?? 0) + 1,
                                      }
                                    : it,
                                ),
                              );
                              setMessage("❌ Erro de rede");
                              setTimeout(() => setMessage(null), 2500);
                            }
                          }}
                          disabled={(item.quantity ?? 0) <= 0}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background:
                              (item.quantity ?? 0) > 0 ? "#4CAF50" : "#ccc",
                            color: "white",
                            border: "none",
                            cursor:
                              (item.quantity ?? 0) > 0
                                ? "pointer"
                                : "not-allowed",
                          }}
                        >
                          Usar no Samurai
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 14, color: "var(--foreground)" }}>{label}</div>
        <div style={{ fontSize: 14, color: "var(--foreground)" }}>{value}%</div>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 8,
          background: "var(--muted)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color || "#888",
            transition: "width 230ms ease",
          }}
        />
      </div>
    </div>
  );
}

function btnStyle(bg: string) {
  return {
    padding: "8px 14px",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  } as React.CSSProperties;
}
