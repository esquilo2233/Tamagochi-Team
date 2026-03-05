"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BugReportFile = {
  id: number;
  bugReportId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
};

type BugReport = {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  reporter: string | null;
  email: string | null;
  url: string | null;
  files: BugReportFile[];
  createdAt: string;
  updatedAt: string;
};

type SeverityColor = {
  bg: string;
  text: string;
};

const severityColors: Record<string, SeverityColor> = {
  low: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-300",
  },
  critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
  },
};

const statusColors: Record<string, SeverityColor> = {
  open: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
  },
  in_progress: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
  },
  resolved: {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-800 dark:text-gray-300",
  },
  closed: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
  },
};

export default function BugReportsAdminPage() {
  const router = useRouter();
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bugToDelete, setBugToDelete] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      console.log("[BugAdmin] A verificar acesso...");
      const response = await fetch("/api/session");
      console.log("[BugAdmin] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[BugAdmin] Dados da sessão:", data);
        const person = data.person;

        // Apenas admin ou gestor podem aceder
        if (person && (person.role === "admin" || person.role === "gestor")) {
          console.log(
            "[BugAdmin] Acesso concedido para:",
            person.name,
            person.role,
          );
          setHasAccess(true);
          return;
        } else {
          console.log("[BugAdmin] Acesso negado - role:", person?.role);
        }
      } else {
        console.log("[BugAdmin] Response não OK");
      }

      // Se não tem sessão válida ou não tem role, não tem acesso
      setHasAccess(false);
    } catch (error) {
      console.error("[BugAdmin] Erro ao verificar acesso:", error);
      // Em caso de erro, não concede acesso
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchBugReports = async () => {
    try {
      const response = await fetch("/api/bug-reports");
      if (response.ok) {
        const data = await response.json();
        setBugReports(data);
      }
    } catch (error) {
      console.error("Erro ao buscar bug reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingStatus(id);
    try {
      await fetch(`/api/bug-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBugReports();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const confirmDelete = (id: number) => {
    setBugToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!bugToDelete) return;

    setDeletingId(bugToDelete);
    try {
      const response = await fetch(`/api/bug-reports/${bugToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao eliminar");
      }

      fetchBugReports();
      setShowDeleteConfirm(false);
      setBugToDelete(null);
      if (selectedBug?.id === bugToDelete) {
        setSelectedBug(null);
      }
    } catch (error) {
      console.error("Erro ao eliminar bug report:", error);
      alert("Erro ao eliminar bug report");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReports = bugReports.filter((report) => {
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    if (filterSeverity !== "all" && report.severity !== filterSeverity)
      return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          A verificar permissões...
        </p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen py-8 px-4" data-theme-container>
        <div className="max-w-2xl mx-auto">
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            data-theme-card
          >
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                background: "#fff3cd",
                color: "#856404",
                marginBottom: 16,
              }}
            >
              Sem permissão para aceder à Gestão de Bugs. Apenas pessoas com
              role <strong>admin</strong> ou <strong>gestor</strong> podem
              entrar.
            </div>
            <Link
              href="/admin"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
              }}
            >
              ← Voltar ao Painel Cenas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
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
                🐛 Bugs Reportados
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {bugReports.length} bug(s) encontrado(s)
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/bug-report"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                🐛 Reportar Bug
              </a>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                ← Voltar
              </Link>
              <button
                onClick={fetchBugReports}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Progresso</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severidade
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Título
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Severidade
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Reporter
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Ficheiros
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedBug(report)}
                        className="text-left font-medium text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {report.title}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          severityColors[report.severity]?.bg
                        } ${severityColors[report.severity]?.text}`}
                      >
                        {report.severity === "low" && "Baixa"}
                        {report.severity === "medium" && "Média"}
                        {report.severity === "high" && "Alta"}
                        {report.severity === "critical" && "Crítica"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[report.status]?.bg
                        } ${statusColors[report.status]?.text}`}
                      >
                        {report.status === "open" && "Aberto"}
                        {report.status === "in_progress" && "Em Progresso"}
                        {report.status === "resolved" && "Resolvido"}
                        {report.status === "closed" && "Fechado"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {report.reporter || "Anônimo"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {report.files.length > 0 ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          📎 {report.files.length}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <select
                          value={report.status}
                          onChange={(e) =>
                            updateStatus(report.id, e.target.value)
                          }
                          disabled={updatingStatus === report.id}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="open">Aberto</option>
                          <option value="in_progress">Em Progresso</option>
                          <option value="resolved">Resolvido</option>
                          <option value="closed">Fechado</option>
                        </select>
                        <button
                          onClick={() => confirmDelete(report.id)}
                          disabled={deletingId === report.id}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-red-300 transition"
                        >
                          {deletingId === report.id ? "..." : "🗑️"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum bug reportado com esses filtros.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhes */}
      {selectedBug && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBug(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedBug.title}
                </h2>
                <button
                  onClick={() => setSelectedBug(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Descrição
                  </label>
                  <p className="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
                    {selectedBug.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Severidade
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          severityColors[selectedBug.severity]?.bg
                        } ${severityColors[selectedBug.severity]?.text}`}
                      >
                        {selectedBug.severity}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[selectedBug.status]?.bg
                        } ${statusColors[selectedBug.status]?.text}`}
                      >
                        {selectedBug.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Reporter
                    </label>
                    <p className="mt-1 text-gray-800 dark:text-white">
                      {selectedBug.reporter || "Anônimo"}
                    </p>
                  </div>

                  {selectedBug.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        E-mail
                      </label>
                      <p className="mt-1 text-gray-800 dark:text-white">
                        {selectedBug.email}
                      </p>
                    </div>
                  )}
                </div>

                {selectedBug.url && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      URL
                    </label>
                    <p className="mt-1 text-gray-800 dark:text-white text-sm break-all">
                      {selectedBug.url}
                    </p>
                  </div>
                )}

                {selectedBug.files.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                      Ficheiros Anexados
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedBug.files.map((file) => (
                        <div
                          key={file.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                        >
                          {file.fileType.startsWith("image") ? (
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={file.fileUrl}
                                alt={file.fileName}
                                className="w-full h-32 object-cover"
                              />
                            </a>
                          ) : file.fileType.startsWith("video") ? (
                            <video
                              src={file.fileUrl}
                              controls
                              className="w-full h-32"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400">
                                📄 {file.fileName}
                              </span>
                            </div>
                          )}
                          <div className="p-2 bg-gray-50 dark:bg-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.fileSize)}
                            </p>
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Abrir →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Criado em
                    </label>
                    <p className="mt-1 text-gray-800 dark:text-white">
                      {formatDate(selectedBug.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Atualizado em
                    </label>
                    <p className="mt-1 text-gray-800 dark:text-white">
                      {formatDate(selectedBug.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de eliminação */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              🗑️ Confirmar Eliminação
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem a certeza que deseja eliminar este bug report? Todos os
              ficheiros associados serão também eliminados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {deletingId !== null ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
