import { NextRequest } from "next/server";
import { getRoom, addClient, removeClient, notifyClients } from "../storage";

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return new Response(
      JSON.stringify({ ok: false, error: "roomId necessário" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Adiciona este cliente à lista de listeners da sala
      addClient(roomId, controller);

      // Envia estado atual imediatamente
      const room = await getRoom(roomId);
      if (room) {
        controller.enqueue(`data: ${JSON.stringify({ ok: true, room })}\n\n`);
      }

      // Enviar heartbeat a cada 15 segundos para manter conexão activa
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup quando o cliente desconectar
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeClient(roomId, controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
