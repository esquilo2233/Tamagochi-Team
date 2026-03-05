"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";

type Severity = "low" | "medium" | "high" | "critical";

interface UploadedFile {
  file: File;
  preview: string;
  url?: string;
}

interface FileInfo {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export default function BugReportPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as Severity,
    reporter: "",
    email: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [filesInfo, setFilesInfo] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = [];

    files.forEach((file) => {
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, preview });
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async (): Promise<boolean> => {
    if (uploadedFiles.length === 0) return true;

    setUploading(true);
    const uploaded: FileInfo[] = [];

    try {
      for (const uploadedFile of uploadedFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", uploadedFile.file);

        const response = await fetch("/api/bug-report-files", {
          method: "POST",
          body: formDataUpload,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erro no upload");
        }

        const data = await response.json();
        uploaded.push(data.file);
      }

      setFilesInfo(uploaded);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro no upload de ficheiros",
      );
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Primeiro fazer upload dos ficheiros
      const filesUploaded = await uploadFiles();
      if (!filesUploaded) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          url: window.location.href,
          files: filesInfo.length > 0 ? filesInfo : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar bug report");
      }

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        reporter: "",
        email: "",
      });
      setUploadedFiles([]);
      setFilesInfo([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen py-12 px-4" data-theme-container>
      <div className="max-w-2xl mx-auto">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          data-theme-card
        >
          <div style={{ marginBottom: 24 }}>
            <Link
              href="/"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
              }}
            >
              ← Voltar
            </Link>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
              🐛 Reportar Bug
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Encontrou um problema? Ajude-nos a melhorar!
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium">
                ✓ Bug reportado com sucesso! Obrigado pela sua contribuição.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-medium">
                ✗ {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Resumo breve do problema"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Descrição *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Severidade
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Baixa - Problema cosmético</option>
                <option value="medium">Média - Funcionalidade afetada</option>
                <option value="high">Alta - Impacto significativo</option>
                <option value="critical">Crítica - Sistema indisponível</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📎 Anexos (Imagens/Vídeos)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition">
                <input
                  type="file"
                  id="files"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="files"
                  className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Clique para selecionar ficheiros
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Imagens (JPEG, PNG, GIF, WebP) e Vídeos (MP4, WebM, MOV) - Máx
                  10MB
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.file.type.startsWith("video") ? (
                        <video
                          src={file.preview}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {file.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reporter"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Seu Nome
                </label>
                <input
                  type="text"
                  id="reporter"
                  name="reporter"
                  value={formData.reporter}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {uploading
                ? "📤 A fazer upload..."
                : loading
                  ? "⏳ Enviando..."
                  : "🚀 Enviar Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
