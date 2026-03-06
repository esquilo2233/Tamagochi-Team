"use client";

import { useEffect, useState } from "react";

type Person = {
  id: number;
  name: string | null;
  code: string;
  role: string | null;
  coins: number;
};

const STORAGE_KEY = "person_data_v1";

export function usePersonData() {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPerson() {
      try {
        // Tenta carregar do localStorage primeiro (cache)
        if (typeof window !== "undefined") {
          const cached = window.localStorage.getItem(STORAGE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as Person;
              // Verifica se não é muito antigo (5 min)
              const now = Date.now();
              if (parsed && now - (parsed as any).timestamp < 5 * 60 * 1000) {
                setPerson({
                  id: parsed.id,
                  name: parsed.name,
                  code: parsed.code,
                  role: parsed.role,
                  coins: parsed.coins,
                });
                setLoading(false);
                // Ainda faz fetch para atualizar
              }
            } catch {
              // Ignora erro de parsing
            }
          }
        }

        // Fetch dos dados atualizados
        // Primeiro tenta /api/me (mais rápido, sem código)
        const meRes = await fetch("/api/me");
        const meJson = await meRes.json();

        // Depois tenta /api/session para obter a role
        const sessionRes = await fetch("/api/session");
        const sessionJson = await sessionRes.json();

        if (mounted && (meJson?.ok || sessionJson?.ok)) {
          const personData: Person = {
            id: meJson?.person?.id || sessionJson?.person?.id,
            name: meJson?.person?.name || sessionJson?.person?.name,
            code: sessionJson?.person?.code || "",
            role: sessionJson?.person?.role || "",
            coins: meJson?.person?.coins || sessionJson?.person?.coins || 0,
          };
          setPerson(personData);

          // Guarda no localStorage com timestamp
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                ...personData,
                timestamp: Date.now(),
              }),
            );
          }
        } else if (!meJson?.ok && !sessionJson?.ok) {
          setPerson(null);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da pessoa:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPerson();

    return () => {
      mounted = false;
    };
  }, []);

  return { person, loading };
}

export function getPersonFromStorage(): Person | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Person & { timestamp?: number };
    // Verifica se não é muito antigo (30 min)
    const now = Date.now();
    if (parsed && parsed.timestamp && now - parsed.timestamp < 30 * 60 * 1000) {
      return {
        id: parsed.id,
        name: parsed.name,
        code: parsed.code,
        role: parsed.role,
        coins: parsed.coins,
      };
    }
  } catch {
    // Ignora erro
  }
  return null;
}
