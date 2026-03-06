"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAdminAccess() {
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((j) => {
        const role = String(j?.person?.role ?? "").toLowerCase();
        const allowed = j?.ok && (role === "admin" || role === "gestor");
        setHasAccess(allowed);

        if (!allowed) {
          console.log("[AdminAccess] Acesso negado - role:", j?.person?.role);
        }
      })
      .catch(() => {
        console.error("[AdminAccess] Erro ao verificar acesso");
        setHasAccess(false);
      })
      .finally(() => setCheckingAccess(false));
  }, []);

  return { hasAccess, checkingAccess };
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { hasAccess, checkingAccess } = useAdminAccess();

  if (checkingAccess) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <div>A verificar permissões...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{
        maxWidth: 760,
        margin: "24px auto",
        padding: 16,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        borderRadius: 12,
      }}>
        <div style={{
          padding: 16,
          borderRadius: 8,
          background: "#fff3cd",
          color: "#856404",
          marginBottom: 16,
        }}>
          <strong>⚠️ Acesso Negado</strong>
          <p style={{ margin: "8px 0" }}>
            Sem permissão para aceder a esta página. Apenas <strong>admin</strong> e <strong>gestor</strong>.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            🏠 Página Principal
          </a>
          <a
            href="/admin"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: "var(--card-bg)",
              color: "var(--foreground)",
              textDecoration: "none",
              fontWeight: 500,
              border: "1px solid var(--card-border)",
            }}
          >
            🎛️ Painel Admin
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
