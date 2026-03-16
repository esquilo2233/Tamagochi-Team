"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface UserSession {
  id: number;
  name: string;
  coins: number;
  code: string;
}

export default function BetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [betting, setBetting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchBet();
    fetchUser();
  }, [params.id]);

  const fetchBet = async () => {
    try {
      const res = await fetch(`/api/bets/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBet(data);
      }
    } catch (error) {
      console.error("Erro ao buscar bet:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    }
  };

  const handleBet = async () => {
    if (!selectedOption || selectedOption < 0) {
      setMessage({ type: "error", text: "Selecione uma opção" });
      return;
    }

    if (!user || user.coins < betAmount) {
      setMessage({ type: "error", text: "Coins insuficientes" });
      return;
    }

    setBetting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/bets/${bet?.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionIdx: selectedOption,
          coins: betAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        fetchBet();
        fetchUser();
        setSelectedOption(null);
        setBetAmount(10);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao realizar aposta" });
      console.error(error);
    } finally {
      setBetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Bet não encontrada</h1>
          <Link href="/bets" className="text-purple-300 hover:text-purple-200">
            ← Voltar para Bets
          </Link>
        </div>
      </div>
    );
  }

  const options = bet.options || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link
          href="/bets"
          className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-6"
        >
          ← Voltar
        </Link>

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                bet.status === "active"
                  ? "bg-green-500"
                  : bet.status === "resolved"
                  ? "bg-blue-500"
                  : "bg-gray-500"
              }`}
            >
              {bet.status === "active" ? "Ativa" : bet.status}
            </span>
            {bet.endsAt && (
              <span className="text-sm text-purple-300">
                Termina em: {new Date(bet.endsAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{bet.title}</h1>

          {bet.description && (
            <p className="text-purple-200 mb-4">{bet.description}</p>
          )}

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-purple-300">Total Apostado:</span>
              <span className="ml-2 text-yellow-400 font-bold">
                🪙 {bet.totalPool}
              </span>
            </div>
            <div>
              <span className="text-purple-300">Apostas:</span>
              <span className="ml-2 text-white font-bold">{bet.totalVotes}</span>
            </div>
            <div>
              <span className="text-purple-300">Criador:</span>
              <span className="ml-2 text-purple-200">{bet.creator.name}</span>
            </div>
          </div>
        </div>

        {/* Opções */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Opções</h2>

          <div className="space-y-3">
            {options.map((opt: any, idx: number) => {
              const percentage = opt.percentage || 0;
              const isSelected = selectedOption === idx;

              return (
                <div
                  key={idx}
                  onClick={() => bet.status === "active" && setSelectedOption(idx)}
                  className={`relative overflow-hidden rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-purple-500/30 border-2 border-purple-400"
                      : "bg-white/5 border-2 border-transparent hover:border-purple-400/50"
                  } ${bet.status !== "active" ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {/* Barra de progresso */}
                  <div
                    className="absolute inset-0 bg-purple-500/20 transition-all"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{opt.label}</p>
                      <p className="text-purple-300 text-sm">
                        {opt.voteCount || 0} apostas • 🪙 {opt.totalCoins || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-300 text-xs">Probabilidade</p>
                      <p className="text-white font-bold">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Apostar */}
        {bet.status === "active" && user && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Fazer Aposta</h2>

            {message.text && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-500/20 border border-green-500 text-green-200"
                    : "bg-red-500/20 border border-red-500 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="mb-4">
              <p className="text-purple-200 text-sm mb-2">
                Suas coins: <span className="text-yellow-400 font-bold">🪙 {user.coins}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Quantidade de coins
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max={user.coins}
              />
              <div className="flex gap-2 mt-2">
                {[10, 50, 100, user.coins].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    className="px-3 py-1 bg-white/10 rounded text-sm text-purple-200 hover:bg-white/20 transition"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBet}
              disabled={betting || selectedOption === null}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {betting ? "Apostando..." : selectedOption === null ? "Selecione uma opção" : `Apostar ${betAmount} coins`}
            </button>
          </div>
        )}

        {/* Sem sessão */}
        {!user && bet.status === "active" && (
          <div className="text-center text-purple-200 py-8">
            <p>Faça login para apostar</p>
          </div>
        )}
      </div>
    </div>
  );
}
