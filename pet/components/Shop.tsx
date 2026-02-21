"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Shop() {
  const [items, setItems] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [people, setPeople] = useState<Array<any>>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [sessionPerson, setSessionPerson] = useState<{ id: number; name: string; coins: number } | null>(null);

  async function load() {
    try {
      const [iRes, sRes, pRes] = await Promise.all([fetch('/api/shop'), fetch('/api/session'), fetch('/api/people')]);
      const ij = await iRes.json();
      const sj = await sRes.json();
      const pj = await pRes.json();
      setItems(Array.isArray(ij) ? ij : []);
      setPeople(Array.isArray(pj) ? pj : []);
      if (sj?.ok && sj?.person) {
        setHasSession(true);
        setSelectedPersonId(sj.person.id);
        setSessionPerson({ id: sj.person.id, name: sj.person.name, coins: sj.person.coins ?? 0 });
      } else {
        setHasSession(false);
        setSelectedPersonId(null);
        setSessionPerson(null);
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { load(); }, []);

  async function buy(itemId: number) {
    if (!hasSession || !selectedPersonId) { setNotice('Entre com o seu código para comprar'); setTimeout(() => setNotice(null), 2000); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/shop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId: selectedPersonId, itemId, petId: 1 }) });
      const j = await res.json();
      if (j?.ok) {
        setNotice('Compra realizada!');
        await load();
      } else {
        setNotice('Falha: ' + (j?.error ?? 'erro'));
      }
    } catch (e) {
      setNotice('Erro de rede');
    } finally { setLoading(false); setTimeout(() => setNotice(null), 2000); }
  }

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0' }}>
        <h2 style={{ margin: 0 }}>Loja</h2>
        <Link href="/shop/create" style={{ color: '#0984e3', textDecoration: 'none', fontWeight: 700 }}>
          + Criar comida
        </Link>
      </div>
      {notice && <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: '#e6fffa', color: '#065f46' }}>{notice}</div>}

      {hasSession && sessionPerson ? (
        <div style={{ marginBottom: 12, color: 'var(--muted)' }}>
          A comprar como: <strong style={{ color: 'var(--foreground)' }}>{sessionPerson.name}</strong> ({sessionPerson.coins} moedas)
        </div>
      ) : !hasSession ? (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: '#fff3cd', color: '#856404' }}>
          Entre com o seu código na página principal para comprar.
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map(it => (
          <div key={it.id} style={{ padding: 12, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
            <div style={{ fontWeight: 700 }}>{it.name} — {it.price} moedas</div>
            <div style={{ color: 'var(--muted)', margin: '8px 0' }}>{it.type}</div>
            {it.effect && typeof it.effect === 'object' && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                {it.effect.hunger && `+${it.effect.hunger} Fome `}
                {it.effect.energy && `+${it.effect.energy} Energia `}
                {it.effect.happiness && `+${it.effect.happiness} Felicidade `}
                {it.effect.hygiene && `+${it.effect.hygiene} Higiene `}
                {it.effect.life && `+${it.effect.life} Vida `}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => buy(it.id)} disabled={loading || !hasSession} style={{ padding: '8px 12px', borderRadius: 6, background: hasSession ? '#0984e3' : '#ccc', color: 'white', border: 'none', cursor: hasSession ? 'pointer' : 'not-allowed' }}>Comprar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ color: 'var(--muted-2)' }}>Nenhum item disponível.</div>}
      </div>

    </div>
  );
}
