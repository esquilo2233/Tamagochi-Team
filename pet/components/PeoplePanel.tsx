"use client";

import React, { useEffect, useState } from "react";

export default function PeoplePanel({ petId }: { petId: number | null }) {
  const [people, setPeople] = useState<Array<any>>([]);
  const [sessions, setSessions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      const [pRes, sRes] = await Promise.all([fetch("/api/people"), fetch("/api/work-sessions")]);
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      setPeople(Array.isArray(pJson) ? pJson : []);
      setSessions(Array.isArray(sJson) ? sJson : []);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { load(); }, []);

  async function startSession(personId: number) {
    if (!petId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/work-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', personId, petId }) });
      const j = await res.json();
      if (j && j.active) {
        setNotice(null);
      }
      await load();
    } catch (e) {
      setNotice('Erro ao iniciar sessão. Tente novamente.');
    } finally { setLoading(false); }
  }

  async function stopSession(sessionId: number) {
    setLoading(true);
    try {
      await fetch('/api/work-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', sessionId }) });
      await load();
    } finally { setLoading(false); }
  }

  return (
    <div style={{ marginTop: 18, borderTop: '1px solid #eee', paddingTop: 12 }}>
      {notice && <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: '#fff4e5', color: '#664d03' }}>{notice}</div>}
      <h3 style={{ marginBottom: 8 }}>Colegas / Pessoas</h3>

    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
        <button onClick={load} style={{ padding: '8px 12px', borderRadius: 6, background: '#dfe6e9', border: 'none' }}>Atualizar</button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--muted)', marginBottom: 6 }}>Pessoas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {people.map((p: any) => {
              const activeSessionsForThisPerson = sessions.filter(s => s.petId === petId && s.active && s.personId === p.id);
              const isActiveWithThis = activeSessionsForThisPerson.length > 0;
              return (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
                  <div>{p.name} <small style={{ color: 'var(--muted)' }}>{p.role ? `· ${p.role}` : ''}</small></div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startSession(p.id)} disabled={loading} style={{ padding: '6px 8px', borderRadius: 6, background: isActiveWithThis ? '#00b894' : '#0984e3', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {isActiveWithThis ? `Ativo (${activeSessionsForThisPerson.length})` : 'Iniciar'}
                    </button>
                  </div>
                </div>
              );
            })}
            {people.length === 0 && <div style={{ color: 'var(--muted-2)' }}>Nenhuma pessoa ainda.</div>}
          </div>
        </div>

        <div style={{ width: 260 }}>
          <div style={{ color: 'var(--muted)', marginBottom: 6 }}>Sessões Ativas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sessions.filter(s => s.active).map((s: any) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
                <div>{s.person?.name ?? ('#' + s.personId)} <small style={{ color: 'var(--muted)' }}>{new Date(s.startedAt).toLocaleTimeString()}</small></div>
                <div><button onClick={() => stopSession(s.id)} style={{ padding: '6px 8px', borderRadius: 6, background: '#d63031', color: 'white', border: 'none' }}>Parar</button></div>
              </div>
            ))}
            {sessions.filter(s => s.active).length === 0 && <div style={{ color: 'var(--muted-2)' }}>Nenhuma sessão ativa.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
