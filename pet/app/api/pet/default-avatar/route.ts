import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updatePetAvatar } from "../../../../lib/pet";
import { DEFAULT_SAMURAI_SVG } from "../../../../lib/default-avatar";

export async function POST() {
  try {
    // Converter SVG string para Buffer
    const svgBuffer = Buffer.from(DEFAULT_SAMURAI_SVG, 'utf-8');
    
    // Fazer upload para o blob
    const blob = await put("avatars/default-samurai.svg", svgBuffer, {
      access: 'public',
      contentType: 'image/svg+xml',
      addRandomSuffix: false,
    });
    
    // Atualizar o pet com a URL do avatar padrão
    await updatePetAvatar(blob.url);
    
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Erro ao fazer upload do avatar padrão",
      },
      { status: 500 },
    );
  }
}
