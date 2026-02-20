"use client";

import React, { useEffect, useState } from "react";

export default function TopPeople({ limit = 5 }: { limit?: number }) {
  const [people, setPeople] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/people');
      const j = await res.json();
      const arr = Array.isArray(j) ? j : [];
      arr.sort((a: any, b: any) => (b.coins ?? 0) - (a.coins ?? 0));
      setPeople(arr.slice(0, limit));
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Top Moedas</strong>
        <button onClick={load} style={{ padding: '4px 8px', borderRadius: 6, background: '#dfe6e9', border: 'none' }}>⟳</button>
      </div>

      {loading && <div style={{ color: 'var(--muted)' }}>Carregando...</div>}

      {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ width: 24 }}>#</th>
              <th>Nome</th>
              <th style={{ textAlign: 'right' }}>Moedas</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p, i) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                <td style={{ padding: '6px 4px' }}>{i + 1}</td>
                <td style={{ padding: '6px 4px' }}>{p.name}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700 }}>{p.coins ?? 0}</td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '6px 4px', color: 'var(--muted-2)' }}>Nenhuma pessoa cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
