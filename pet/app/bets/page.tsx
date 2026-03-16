"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Bet {
  id: number;
  title: string;
  description: string | null;
  creator: {
    id: number;
    name: string;
    code: string;
  };
  options: any[];
  status: string;
  endsAt: string | null;
  createdAt: string;
  totalPool: number;
  totalVotes: number;
}

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetchBets();
  }, [filter]);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bets?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setBets(data);
      }
    } catch (error) {
      console.error("Erro ao buscar bets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎲 Bets</h1>
          <p className="text-purple-200">
            Aposte suas coins e ganhe prêmios!
          </p>
        </div>

        {/* Filtros e Criar */}
        <div className="flex flex-wrap gap-4 mb-6 justify-between items-center">
          <div className="flex gap-2">
            {["active", "resolved", "all"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-purple-200 hover:bg-white/20"
                }`}
              >
                {status === "active"
                  ? "Ativas"
                  : status === "resolved"
                  ? "Resolvidas"
                  : "Todas"}
              </button>
            ))}
          </div>

          <Link
            href="/bets/create"
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
          >
            + Criar Bet
          </Link>
        </div>

        {/* Lista de Bets */}
        {loading ? (
          <div className="text-center text-purple-200 py-12">
            Carregando bets...
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center text-purple-200 py-12">
            Nenhuma bet encontrada
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BetCard({ bet }: { bet: Bet }) {
  const options = bet.options || [];
  const totalPool = bet.totalPool || 0;
  const totalVotes = bet.totalVotes || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "resolved":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Link href={`/bets/${bet.id}`}>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all hover:scale-105 cursor-pointer">
        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
              bet.status
            )}`}
          >
            {bet.status === "active" ? "Ativa" : bet.status}
          </span>
          {bet.endsAt && (
            <span className="text-xs text-purple-300">
              {new Date(bet.endsAt).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-white mb-2">{bet.title}</h3>

        {/* Descrição */}
        {bet.description && (
          <p className="text-purple-200 text-sm mb-4 line-clamp-2">
            {bet.description}
          </p>
        )}

        {/* Opções */}
        <div className="space-y-2 mb-4">
          {options.slice(0, 3).map((opt: any, idx: number) => (
            <div
              key={idx}
              className="bg-white/5 rounded-lg p-2 text-sm text-purple-100"
            >
              {opt.label}
            </div>
          ))}
          {options.length > 3 && (
            <p className="text-xs text-purple-300 text-center">
              +{options.length - 3} opções
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-purple-300">Total Apostado</p>
            <p className="text-lg font-bold text-yellow-400">
              🪙 {totalPool}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-purple-300">Apostas</p>
            <p className="text-lg font-bold text-white">{totalVotes}</p>
          </div>
        </div>

        {/* Creator */}
        <div className="mt-3 text-xs text-purple-300">
          Criado por: <span className="text-purple-200">{bet.creator.name}</span>
        </div>
      </div>
    </Link>
  );
}
