"use client";

import Link from "next/link";
import PeopleManager from "../../components/PeopleManager";
import { useAdminAccess } from "@/lib/useAdminAccess";

export default function PeoplePage() {
  const { hasAccess, checkingAccess } = useAdminAccess();

  // Mostrar loading enquanto verifica permissões
  if (checkingAccess) {
    return (
      <main style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            background: "var(--card-bg)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>A verificar permissões...</div>
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
            marginBottom: 16,
          }}
        >
          <strong>⚠️ Acesso Negado</strong>
          <p style={{ margin: "8px 0" }}>
            Sem permissão para aceder à página de pessoas. Apenas{" "}
            <strong>admin</strong> e <strong>gestor</strong>.
          </p>
          <p style={{ margin: "8px 0", fontSize: 14 }}>
            💡 Dica: Precisas de fazer login primeiro na página principal.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
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
          </Link>
          <Link
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
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={{ maxWidth: 760, margin: "16px auto 0", padding: "0 16px" }}>
        <Link
          href="/"
          style={{ color: "var(--accent)", textDecoration: "underline" }}
        >
          ← Voltar
        </Link>
      </div>
      <PeopleManager />
    </main>
  );
}
