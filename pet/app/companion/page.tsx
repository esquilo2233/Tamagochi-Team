"use client";

import { useEffect, useState } from "react";
import PetCompanion from "../../components/PetCompanion";

export default function CompanionPage() {
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) {
      setCode(c);
    }
  }, []);

  if (!code) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Código não fornecido.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--background)" }}>
      <PetCompanion code={code} onClose={() => window.close()} />
    </div>
  );
}
