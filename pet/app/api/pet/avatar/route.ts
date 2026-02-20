import { NextResponse } from "next/server";
import { updatePetAvatar } from "../../../../lib/pet";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Ficheiro não enviado" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Tipo não permitido. Use JPEG, PNG, GIF, WebP ou SVG." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Ficheiro demasiado grande (máx. 5MB)" },
        { status: 400 }
      );
    }

    // Upload para Vercel Blob Storage
    const blob = await put(`avatars/avatar-${Date.now()}.${file.name.split('.').pop()}`, file, {
      access: 'public',
      contentType: file.type,
    });

    // Salvar URL completa no banco de dados
    await updatePetAvatar(blob.url);

    return NextResponse.json({ ok: true, avatarUrl: blob.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao fazer upload";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
