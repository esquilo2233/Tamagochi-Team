"use client";

import React from "react";
import Link from "next/link";
import Shop from "../../components/Shop";

export default function Page() {
  return (
    <main>
      <div style={{ maxWidth: 760, margin: "16px auto 0", padding: "0 16px" }}>
        <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
          ← Voltar
        </Link>
      </div>
      <Shop />
    </main>
  );
}
