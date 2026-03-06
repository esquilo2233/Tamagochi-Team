import React from "react";
import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import PeopleManager from "../../components/PeopleManager";

export default async function Page() {
  const cookieStore = await cookies();
  const code = cookieStore.get("person_session")?.value;
  let allowed = false;
  let hasSession = false;
  let personRole = null;

  if (code) {
    hasSession = true;
    const person = await prisma.person.findUnique({ where: { code } });
    if (person) {
      personRole = person.role;
      const role = (person.role ?? "").trim().toLowerCase();
      allowed = role === "admin" || role === "gestor";
    }
  }

  if (!allowed) {
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
          {!hasSession && (
            <p style={{ margin: "8px 0", fontSize: 14 }}>
              💡 Dica: Precisas de fazer login primeiro na página principal.
            </p>
          )}
          {hasSession && personRole && (
            <p style={{ margin: "8px 0", fontSize: 14 }}>
              A tua role atual: <strong>{personRole}</strong>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
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
