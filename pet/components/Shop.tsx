"use client";

import React, { useEffect, useState } from "react";

export default function Shop() {
  const [items, setItems] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [people, setPeople] = useState<Array<any>>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  async function load() {
    try {
      const [iRes, pRes] = await Promise.all([fetch('/api/shop'), fetch('/api/people')]);
      const ij = await iRes.json();
      const pj = await pRes.json();
      setItems(Array.isArray(ij) ? ij : []);
      setPeople(Array.isArray(pj) ? pj : []);
      if (Array.isArray(pj) && pj.length > 0 && selectedPersonId == null) setSelectedPersonId(pj[0].id);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { load(); }, []);

  async function buy(itemId: number) {
    if (!selectedPersonId) { setNotice('Selecione uma pessoa'); setTimeout(() => setNotice(null), 2000); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/shop/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId: selectedPersonId, itemId, petId: 1 }) });
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
      <h2>Loja</h2>
      {notice && <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: '#e6fffa', color: '#065f46' }}>{notice}</div>}

      <div style={{ marginBottom: 12 }}>
        <label style={{ color: 'var(--muted)' }}>Comprar como:</label>
        <select value={selectedPersonId ?? ''} onChange={e => setSelectedPersonId(Number(e.target.value))} style={{ marginLeft: 8 }}>
          {people.map(p => (<option key={p.id} value={p.id}>{p.name} — {p.coins ?? 0} moedas</option>))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map(it => (
          <div key={it.id} style={{ padding: 12, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)' }}>
            <div style={{ fontWeight: 700 }}>{it.name} — {it.price} moedas</div>
            <div style={{ color: 'var(--muted)', margin: '8px 0' }}>{it.type}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => buy(it.id)} disabled={loading} style={{ padding: '8px 12px', borderRadius: 6, background: '#0984e3', color: 'white', border: 'none' }}>Comprar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ color: 'var(--muted-2)' }}>Nenhum item disponível.</div>}
      </div>
    </div>
  );
}
