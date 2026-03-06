import { NextRequest, NextResponse } from "next/server";

// User agents conhecidos de ferramentas de API
const BLOCKED_USER_AGENTS = [
  "postman",
  "insomnia",
  "curl",
  "wget",
  "python-requests",
  "axios",
  "node-fetch",
  "go-http-client",
  "java",
  "okhttp",
  "httpclient",
];

// Verificar se é um browser real
function isRealBrowser(req: NextRequest): boolean {
  const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";
  const accept = req.headers.get("accept") || "";

  // Verificar User Agent bloqueado
  if (BLOCKED_USER_AGENTS.some(agent => userAgent.includes(agent))) {
    return false;
  }

  // Browser reais aceitam HTML
  if (!accept.includes("text/html") && !accept.includes("*/*")) {
    return false;
  }

  // Verificar headers que browsers enviam
  const hasBrowserHeaders =
    req.headers.has("sec-ch-ua") ||
    req.headers.has("sec-ch-ua-mobile") ||
    req.headers.has("sec-ch-ua-platform") ||
    req.headers.has("sec-fetch-dest") ||
    req.headers.has("sec-fetch-mode") ||
    req.headers.has("sec-fetch-site");

  return hasBrowserHeaders;
}

// Verificar Origin/Referer
function hasValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // Se não tem origin nem referer, pode ser Postman
  if (!origin && !referer) {
    return false;
  }

  // Verificar se origin/referer é do mesmo domínio
  if (origin && host && !origin.includes(host)) {
    return false;
  }

  if (referer && host && !referer.includes(host)) {
    return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  // Apenas proteger APIs, não páginas ou assets
  const pathname = request.nextUrl.pathname;

  // Ignorar páginas, assets estáticos, etc.
  if (
    !pathname.startsWith("/api/") ||
    pathname.startsWith("/api/") && (
      pathname.includes(".") ||
      pathname === "/api/me"
    )
  ) {
    return NextResponse.next();
  }

  // Verificar se é um browser real
  if (!isRealBrowser(request)) {
    console.warn(`[Security] Blocked non-browser request: ${pathname}`);
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  // Verificar origin válida
  if (!hasValidOrigin(request)) {
    console.warn(`[Security] Blocked invalid origin: ${pathname}`);
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
