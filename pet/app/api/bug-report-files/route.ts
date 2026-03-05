import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Configurar para permitir apenas imagens e vídeos
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum ficheiro enviado" },
        { status: 400 }
      );
    }

    // Validar tipo de ficheiro
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de ficheiro não permitido. Apenas imagens e vídeos." },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ficheiro muito grande. Máximo 10MB." },
        { status: 400 }
      );
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gerar nome único para o ficheiro
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split(".").pop() || "file";
    const fileName = `bug-report-${timestamp}-${randomString}.${fileExtension}`;

    // Upload para Vercel Blob
    const blob = await put(`bug-reports/${fileName}`, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      file: {
        fileName: file.name,
        fileUrl: blob.url,
        fileType: file.type,
        fileSize: file.size,
      },
    });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "URL do ficheiro é obrigatória" },
        { status: 400 }
      );
    }

    // Extrair o pathname da URL do blob
    // URL formato: https://xxx.public.blob.vercel-storage.com/bug-reports/filename.ext
    const urlParts = fileUrl.split("/");
    const pathname = urlParts.slice(4).join("/"); // Remove protocolo e domínio

    // Eliminar do Vercel Blob
    await del(fileUrl);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao eliminar ficheiro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao eliminar ficheiro" },
      { status: 500 }
    );
  }
}
