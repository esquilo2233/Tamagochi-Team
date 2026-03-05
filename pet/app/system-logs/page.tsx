"use client";

import { useEffect, useState } from "react";

type SystemLog = {
  id: number;
  level: string;
  message: string;
  context: any;
  source: string | null;
  createdAt: string;
};

const levelColors: Record<string, string> = {
  debug: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  warning:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
  error: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs?limit=500");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);

        // Extrair fontes únicas
        const uniqueSources = Array.from(
          new Set(data.map((log: SystemLog) => log.source).filter(Boolean)),
        ) as string[];
        setSources(uniqueSources);
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (filterSource !== "all" && log.source !== filterSource) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getContextValue = (context: any): string => {
    if (!context) return "";
    try {
      return JSON.stringify(context, null, 2);
    } catch {
      return String(context);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Carregando logs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" data-theme-container>
      <div className="max-w-7xl mx-auto">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          data-theme-card
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
                📋 Logs do Sistema
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {logs.length} log(s) registrado(s)
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              🔄 Atualizar
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nível
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fonte
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        levelColors[log.level] || levelColors.info
                      }`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    {log.source && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        [{log.source}]
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(log.createdAt)}
                  </span>
                </div>

                <p className="text-gray-800 dark:text-white mb-2">
                  {log.message}
                </p>

                {log.context && (
                  <details className="mt-2">
                    <summary className="text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-300">
                      Ver contexto ({Object.keys(log.context).length} campos)
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-800 dark:bg-gray-900 text-gray-100 rounded text-xs overflow-auto max-h-48">
                      {getContextValue(log.context)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum log encontrado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
