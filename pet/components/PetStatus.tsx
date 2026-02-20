"use client";

import React, { useEffect, useState } from "react";
import TopPeople from "./TopPeople";
import ClickRush from "./ClickRush";
import PetCompanion from "./PetCompanion";

type Stats = {
  hunger: number;
  energy: number;
  happiness: number;
  hygiene: number;
  life: number;
  coins?: number;
};

const STORAGE_KEY = "tamagochi_pet_state";

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export default function PetStatus() {
  const [stats, setStats] = useState<Stats>({ hunger: 100, energy: 100, happiness: 100, hygiene: 100, life: 100, coins: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [isPetting, setIsPetting] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; emoji: string }>>([]);
  const nextParticleId = React.useRef(1);
  const petRef = React.useRef<HTMLDivElement | null>(null);
  const [minigameActive, setMinigameActive] = useState(false);
  const [minigameTime, setMinigameTime] = useState(5);
  const [minigameCount, setMinigameCount] = useState(0);
  const minigameTimerRef = React.useRef<number | null>(null);
  const minigameCountRef = React.useRef<number>(0);
  const [showClickRush, setShowClickRush] = useState(false);

  const [petId, setPetId] = useState<number | null>(null);
  const [petAvatarUrl, setPetAvatarUrl] = useState<string | null>(null);
  const [peopleList, setPeopleList] = useState<Array<any>>([]);
  const [currentPersonId, setCurrentPersonId] = useState<number | null>(null);
  const [currentPersonCoins, setCurrentPersonCoins] = useState<number>(0);
  const [companionCode, setCompanionCode] = useState("");
  const [companionWindow, setCompanionWindow] = useState<Window | null>(null);

  function loadPet() {
    fetch('/api/pet')
      .then(r => r.json())
      .then((p) => {
        if (p && p.id) {
          setPetId(p.id);
          setStats({ hunger: p.hunger ?? 100, energy: p.energy ?? 100, happiness: p.happiness ?? 100, hygiene: p.hygiene ?? 100, life: p.life ?? 100, coins: 0 });
          if (typeof p.appearance === "string") {
            // Se for URL completa (Vercel Blob) ou caminho relativo
            if (p.appearance.startsWith("http")) {
              // URL completa do Vercel Blob
              setPetAvatarUrl(p.appearance);
            } else if (p.appearance.startsWith("/")) {
              // Caminho relativo (fallback para desenvolvimento local)
              setPetAvatarUrl(p.appearance + "?t=" + Date.now());
            } else {
              setPetAvatarUrl(null);
            }
          } else {
            setPetAvatarUrl(null);
          }
        }
      })
      .catch(() => {
        // fallback to localStorage
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Stats;
            setStats(parsed);
          } catch (e) {
            // ignore
          }
        }
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
    window.addEventListener('focus', handleFocus);
    
    return () => { 
      mounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    // load people for selecting player
    let mounted = true;
    fetch('/api/people').then(r => r.json()).then(j => {
      if (!mounted) return;
      setPeopleList(Array.isArray(j) ? j : []);
      if (Array.isArray(j) && j.length > 0 && currentPersonId === null) {
        setCurrentPersonId(j[0].id);
        setCurrentPersonCoins(j[0].coins ?? 0);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (currentPersonId == null) return;
    // fetch person details to update coins
    fetch(`/api/people`).then(r => r.json()).then(j => {
      const p = Array.isArray(j) ? j.find((x: any) => x.id === currentPersonId) : null;
      if (p) setCurrentPersonCoins(p.coins ?? 0);
    }).catch(() => {});
  }, [currentPersonId]);

  useEffect(() => {
    // keep local copy in case offline
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

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
      const res = await fetch('/api/pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ effect: delta }) });
      const updated = await res.json();
      if (updated && updated.id) {
        setStats({ hunger: updated.hunger ?? 100, energy: updated.energy ?? 100, happiness: updated.happiness ?? 100, hygiene: updated.hygiene ?? 100, life: updated.life ?? 100, coins: updated.coins ?? stats.coins });
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

  return (
    <div style={{ width: "100%", padding: "24px", boxSizing: "border-box", maxWidth: "1400px", margin: "0 auto" }}>
      <style>{`
        @keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes floatUp { 0%{opacity:1; transform: translateY(0) scale(1)} 100%{opacity:0; transform: translateY(-120px) scale(1.1)} }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.3), 0 0 40px rgba(255, 107, 107, 0.2); } 50% { box-shadow: 0 0 30px rgba(255, 107, 107, 0.5), 0 0 60px rgba(255, 107, 107, 0.3); } }
        @keyframes glow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 107, 107, 0.4)); } 50% { filter: drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}</style>
      
      <h1 style={{ textAlign: "center", marginBottom: 24, fontSize: 28 }}>🐾 Seu Tamagochi</h1>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Coluna esquerda: Top People */}
        <aside style={{ width: 280, flexShrink: 0 }}>
          <TopPeople />
        </aside>

        {/* Coluna central: Pet e controles */}
        <div style={{ flex: "1 1 400px", minWidth: 0 }}>
          <div style={{ 
            background: "var(--card-bg)", 
            borderRadius: 16, 
            padding: 24, 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: 24
          }}>
            <div style={{ textAlign: 'center' }}>
              <div
                ref={petRef}
                role="button"
                tabIndex={0}
                onClick={() => {
                  // quick pet animation + small happiness
                  apply({ happiness: 5 }, "Acariciado!");
                  setIsPetting(true);
                  setTimeout(() => setIsPetting(false), 350);
                  // spawn particles
                  const id = nextParticleId.current++;
                  const left = 50 + (Math.random() - 0.5) * 80;
                  const emojis = ["💖", "✨", "💫", "🌟", "🎉", "⚔️", "🗾"];
                  setParticles((p) => [...p, { id, left, emoji: emojis[Math.floor(Math.random() * emojis.length)] }]);
                  setTimeout(() => setParticles((p) => p.filter(x => x.id !== id)), 900);
                  // if in minigame, count tap
                  if (minigameActive) {
                    setMinigameCount((c) => {
                      const next = c + 1;
                      minigameCountRef.current = next;
                      return next;
                    });
                  }
                }}
                style={{
                  width: 280,
                  height: 350,
                  borderRadius: 24,
                  background: `linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%)`,
                  backgroundSize: '200% 200%',
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 30px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  position: "relative",
                  cursor: "pointer",
                  transform: isPetting ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  outline: 'none',
                  border: '3px solid rgba(0, 0, 0, 0.1)',
                  animation: 'pulse 3s ease-in-out infinite, float 4s ease-in-out infinite',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isPetting) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {/* Background glow effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  animation: 'float 6s ease-in-out infinite',
                  pointerEvents: 'none'
                }} />
                
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'transparent',
                  borderRadius: '0',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  border: 'none'
                }}>
                  <img 
                    src={petAvatarUrl || "/samurai.svg"} 
                    alt="Avatar do pet"
                    key={petAvatarUrl || "default"}
                    onError={(e) => {
                      // Fallback para samurai local se a imagem do blob falhar
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/samurai.svg") {
                        target.src = "/samurai.svg";
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                      animation: 'glow 2s ease-in-out infinite',
                      transition: 'transform 200ms ease'
                    }} 
                  />
                </div>

                {/* particles */}
                {particles.map((pt) => (
                  <div key={pt.id} style={{
                    position: 'absolute',
                    left: `calc(${pt.left}% )`,
                    bottom: 30,
                    pointerEvents: 'none',
                    animation: 'floatUp 900ms linear forwards',
                    fontSize: 24,
                    zIndex: 10
                  }}>{pt.emoji}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, color: 'var(--foreground)', fontWeight: 700, fontSize: 18 }}>Samurai</div>
              <div style={{ marginTop: 4, color: 'var(--foreground)' }}>Felicidade: <strong>{stats.happiness}%</strong></div>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setShowClickRush(true)} style={{ padding: '10px 16px', borderRadius: 8, background: '#ff7675', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Brincar (minigame)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Coluna direita: Stats e ações */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ 
            background: "var(--card-bg)", 
            borderRadius: 16, 
            padding: 24, 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <Stat label="Fome" value={stats.hunger} color="#ff6b6b" />
            <Stat label="Energia" value={stats.energy} color="#f6b93b" />
            <Stat label="Higiene" value={stats.hygiene} color="#4ecdc4" />
            <Stat label="Vida" value={stats.life} color="#6a89cc" />

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input
                  type="text"
                  value={companionCode}
                  onChange={(e) => setCompanionCode(e.target.value.toUpperCase())}
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
                    fontFamily: "monospace"
                  }}
                />
                <button
                  onClick={() => {
                    if (!companionCode || companionCode.length !== 6) {
                      setMessage("Código inválido. Use 6 caracteres.");
                      setTimeout(() => setMessage(null), 2500);
                      return;
                    }
                    // Abrir popup window
                    const width = 250;
                    const height = 380;
                    const left = window.screen.width - width - 20;
                    const top = 20;
                    const popup = window.open(
                      `/companion?code=${encodeURIComponent(companionCode)}`,
                      "petCompanion",
                      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no`
                    );
                    if (popup) {
                      setCompanionWindow(popup);
                    }
                  }}
                  style={btnStyle("#e74c3c")}
                >
                  Fazer Companhia
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={() => apply({ hunger: 20, happiness: 5 }, "Alimentado!")}
                style={btnStyle("#4CAF50")}>
                Alimentar
              </button>

              <button onClick={() => apply({ energy: 25, hunger: -8 }, "Dormiu bem!")}
                style={btnStyle("#FF9800")}>
                Dormir
              </button>

              <button onClick={() => apply({ hygiene: 30, happiness: 5 }, "Limpo e cheiroso!")}
                style={btnStyle("#34B3A0")}>
                Limpar
              </button>

              <button onClick={() => apply({ happiness: 15, energy: -10 }, "Brincou bastante!")}
                style={btnStyle("#2196F3")}>
                Brincar (antigo)
              </button>

              <button onClick={() => {
                const delta = { hunger: 100 - stats.hunger, energy: 100 - stats.energy, happiness: 100 - stats.happiness, hygiene: 100 - stats.hygiene, life: 100 - stats.life };
                apply(delta, "Resetado para 100% 🙂");
              }}
                style={btnStyle("#9B59B6")}>
                Resetar
              </button>
            </div>

            {message && <div style={{ marginTop: 16, color: "var(--foreground)", padding: 12, background: "var(--card-border)", borderRadius: 8 }}>{message}</div>}
          </div>
        </div>
      </div>

            <div style={{ marginTop: 24, textAlign: "center", color: "var(--foreground)", fontSize: 13 }}>
        Estado sincronizado com o servidor (Prisma). Se estiver offline, o estado é mantido localmente.
      </div>

      {/* Minigame modal overlay */}
      {showClickRush && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 360 }}>
            <ClickRush personId={currentPersonId ?? undefined} onFinish={async (score, coins) => {
              setShowClickRush(false);
              // fetch pet after server updated coins
              try {
                const res = await fetch('/api/pet');
                const j = await res.json();
                if (j && j.id) {
                  setStats({ hunger: j.hunger ?? 100, energy: j.energy ?? 100, happiness: j.happiness ?? 100, hygiene: j.hygiene ?? 100, life: j.life ?? 100, coins: 0 });
                  // if coins present on pet, update local copy
                }
              } catch (e) {
                // ignore
              }
              // update person coins locally
              if (currentPersonId) {
                try {
                  const p = await fetch('/api/people').then(r => r.json());
                  const found = Array.isArray(p) ? p.find((x: any) => x.id === currentPersonId) : null;
                  if (found) setCurrentPersonCoins(found.coins ?? 0);
                } catch (e) {}
              }
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 14, color: "var(--foreground)" }}>{label}</div>
        <div style={{ fontSize: 14, color: "var(--foreground)" }}>{value}%</div>
      </div>
      <div style={{ height: 12, borderRadius: 8, background: "var(--muted)", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color || "#888", transition: "width 230ms ease" }} />
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
