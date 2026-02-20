"use client";

import React, { useEffect, useState } from "react";

export default function PeopleManager() {
  const [people, setPeople] = useState<Array<any>>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/people');
      const j = await res.json();
      setPeople(Array.isArray(j) ? j : []);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { load(); }, []);

  async function createPerson() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const j = await res.json();
      setName('');
      setNotice('Pessoa adicionada');
      await load();
    } catch (e) {
      setNotice('Erro ao adicionar');
    } finally { setLoading(false); setTimeout(() => setNotice(null), 2200); }
  }

  async function removePerson(id: number) {
    // simple delete endpoint not implemented server-side; fallback: show notice
    setNotice('Remover não implementado (faça manualmente no DB)');
    setTimeout(() => setNotice(null), 2200);
  }

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', padding: 16 }}>
      <h2>Pessoas</h2>
      {notice && <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: '#e6fffa', color: '#065f46' }}>{notice}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da pessoa" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        <button onClick={createPerson} disabled={loading} style={{ padding: '8px 12px', borderRadius: 6, background: '#2ecc71', color: 'white', border: 'none' }}>Adicionar</button>
        <button onClick={load} style={{ padding: '8px 12px', borderRadius: 6, background: '#dfe6e9', border: 'none' }}>Atualizar</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {people.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
            <div>
              <div>{p.name}</div>
              {p.code && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>
                  Código: <strong style={{ letterSpacing: 1 }}>{p.code}</strong>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => removePerson(p.id)} style={{ padding: '6px 10px', borderRadius: 6, background: '#ff6b6b', color: 'white', border: 'none' }}>Remover</button>
            </div>
          </div>
        ))}
        {people.length === 0 && <div style={{ color: 'var(--muted-2)' }}>Nenhuma pessoa cadastrada.</div>}
      </div>
    </div>
  );
}
