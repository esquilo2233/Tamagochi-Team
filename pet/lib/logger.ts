import { prisma } from "./prisma";

export type LogLevel = "debug" | "info" | "warning" | "error";

export interface LogContext {
  [key: string]: any;
}

/**
 * Registra um log no banco de dados
 */
export async function log(
  message: string,
  options: {
    level?: LogLevel;
    source?: string;
    context?: LogContext;
  } = {},
): Promise<void> {
  const { level = "info", source, context } = options;

  try {
    await prisma.systemLog.create({
      data: {
        level,
        message,
        source,
        context: context ? context : undefined,
      },
    });
  } catch (error) {
    // Em caso de falha no log, não quebrar a aplicação
    console.error("Falha ao registrar log no banco:", error);
  }
}

/**
 * Atalhos para níveis de log específicos
 */
export const logger = {
  debug: (
    message: string,
    options?: { source?: string; context?: LogContext },
  ) => log(message, { level: "debug", ...options }),

  info: (
    message: string,
    options?: { source?: string; context?: LogContext },
  ) => log(message, { level: "info", ...options }),

  warning: (
    message: string,
    options?: { source?: string; context?: LogContext },
  ) => log(message, { level: "warning", ...options }),

  error: (
    message: string,
    options?: { source?: string; context?: LogContext },
  ) => log(message, { level: "error", ...options }),
};
