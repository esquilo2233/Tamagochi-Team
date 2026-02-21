import React from "react";
import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import PeopleManager from "../../components/PeopleManager";

export default async function Page() {
  const cookieStore = await cookies();
  const code = cookieStore.get("person_session")?.value;
  let allowed = false;

  if (code) {
    const person = await prisma.person.findUnique({ where: { code } });
    const role = (person?.role ?? "").trim().toLowerCase();
    allowed = role === "admin" || role === "gestor";
  }

  if (!allowed) {
    return (
      <main style={{ maxWidth: 760, margin: "24px auto", padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            ← Voltar
          </Link>
        </div>
        <div style={{ padding: 16, borderRadius: 8, background: "#fff3cd", color: "#856404" }}>
          Sem permissão para aceder à página de pessoas. Apenas <strong>admin</strong> e <strong>gestor</strong>.
        </div>
      </main>
    );
  }

  return (
    <main>
      <div style={{ maxWidth: 760, margin: "16px auto 0", padding: "0 16px" }}>
        <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
          ← Voltar
        </Link>
      </div>
      <PeopleManager />
    </main>
  );
}
