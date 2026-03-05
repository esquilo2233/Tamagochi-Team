import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, severity, reporter, email, url, files } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Título e descrição são obrigatórios" },
        { status: 400 },
      );
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        severity: severity || "medium",
        reporter: reporter || null,
        email: email || null,
        url: url || null,
        files: files
          ? {
              create: files.map((f: any) => ({
                fileName: f.fileName,
                fileUrl: f.fileUrl,
                fileType: f.fileType,
                fileSize: f.fileSize,
              })),
            }
          : undefined,
      },
      include: { files: true },
    });

    // Registrar log do bug report
    await prisma.systemLog.create({
      data: {
        level: "warning",
        message: `Bug reportado: ${title}`,
        context: {
          bugReportId: bugReport.id,
          severity: bugReport.severity,
          reporter: bugReport.reporter,
          filesCount: files?.length || 0,
        },
        source: "bug-report-api",
      },
    });

    return NextResponse.json(bugReport, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar bug report:", error);
    return NextResponse.json(
      { error: "Erro ao criar bug report" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const bugReports = await prisma.bugReport.findMany({
      orderBy: { createdAt: "desc" },
      include: { files: true },
    });

    return NextResponse.json(bugReports);
  } catch (error) {
    console.error("Erro ao buscar bug reports:", error);
    return NextResponse.json(
      { error: "Erro ao buscar bug reports" },
      { status: 500 },
    );
  }
}
