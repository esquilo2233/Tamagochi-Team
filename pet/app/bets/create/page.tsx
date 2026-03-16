"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Option {
    label: string;
}

export default function CreateBetPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        endsAt: "",
    });

    const [options, setOptions] = useState<Option[]>([
        { label: "" },
        { label: "" },
    ]);

    const addOption = () => {
        setOptions([...options, { label: "" }]);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = { label: value };
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validar
        if (!formData.title.trim()) {
            setError("Título é obrigatório");
            setLoading(false);
            return;
        }

        const validOptions = options.filter((opt) => opt.label.trim());
        if (validOptions.length < 2) {
            setError("Pelo menos 2 opções são obrigatórias");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/bets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || undefined,
                    endsAt: formData.endsAt || undefined,
                    options: validOptions.map((opt) => ({
                        label: opt.label,
                    })),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Bet criada com sucesso!");
                setTimeout(() => {
                    router.push("/bets");
                }, 2000);
            } else {
                setError(data.error || "Erro ao criar bet");
            }
        } catch (err) {
            setError("Erro ao criar bet");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🎲 Criar Bet
                    </h1>
                    <p className="text-purple-200">
                        Crie uma nova bet para a comunidade apostar
                    </p>
                </div>

                {/* Formulário */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                >
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Título */}
                    <div className="mb-4">
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Quem vai ganhar o jogo?"
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div className="mb-4">
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Descreva os detalhes da bet..."
                            rows={3}
                        />
                    </div>

                    {/* Data de término */}
                    <div className="mb-4">
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                            Data de término (opcional)
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.endsAt}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    endsAt: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Opções */}
                    <div className="mb-4">
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                            Opções *
                        </label>
                        <p className="text-xs text-purple-300 mb-3">
                            ℹ️ As odds são calculadas automaticamente com base
                            nas apostas
                        </p>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={option.label}
                                        onChange={(e) =>
                                            updateOption(index, e.target.value)
                                        }
                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder={`Opção ${index + 1}`}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="px-3 py-2 bg-red-500/20 border border-red-500 rounded-lg text-red-200 hover:bg-red-500/30 transition"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-3 px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg text-purple-200 hover:bg-purple-500/30 transition text-sm"
                        >
                            + Adicionar opção
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 mt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Criando..." : "Criar Bet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
