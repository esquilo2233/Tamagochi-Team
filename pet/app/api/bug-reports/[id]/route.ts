import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 },
      );
    }

    const bugReport = await prisma.bugReport.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    // Registrar log da atualização
    await prisma.systemLog.create({
      data: {
        level: "info",
        message: `Bug report #${id} atualizado para: ${status}`,
        context: { bugReportId: parseInt(id), newStatus: status },
        source: "bug-report-admin",
      },
    });

    return NextResponse.json(bugReport);
  } catch (error) {
    console.error("Erro ao atualizar bug report:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar bug report" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bugReportId = parseInt(id);

    // Obter o bug report com os ficheiros
    const bugReport = await prisma.bugReport.findUnique({
      where: { id: bugReportId },
      include: { files: true },
    });

    if (!bugReport) {
      return NextResponse.json(
        { error: "Bug report não encontrado" },
        { status: 404 },
      );
    }

    // Eliminar ficheiros do Vercel Blob
    for (const file of bugReport.files) {
      try {
        await del(file.fileUrl);
      } catch (error) {
        console.error(`Erro ao eliminar ficheiro ${file.fileUrl}:`, error);
        // Continuar mesmo se falhar
      }
    }

    // Eliminar o bug report (os ficheiros na BD são eliminados por cascade)
    await prisma.bugReport.delete({
      where: { id: bugReportId },
    });

    // Registrar log da eliminação
    await prisma.systemLog.create({
      data: {
        level: "info",
        message: `Bug report #${id} eliminado`,
        context: {
          bugReportId,
          title: bugReport.title,
          filesDeleted: bugReport.files.length,
        },
        source: "bug-report-admin",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar bug report:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar bug report" },
      { status: 500 },
    );
  }
}
