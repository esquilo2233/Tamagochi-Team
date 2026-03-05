/**
 * Exemplos de uso do logger no sistema
 *
 * Importe em qualquer arquivo do projeto:
 *
 * import { logger } from "@/lib/logger";
 *
 * // Uso básico
 * await logger.info("Usuário logado", { source: "auth", context: { userId: 123 } });
 * await logger.error("Erro ao processar pagamento", { source: "payment", context: { error: err.message } });
 * await logger.warning("Tentativa de login falhou", { source: "auth", context: { email: "user@example.com" } });
 * await logger.debug("Dados recebidos", { source: "api", context: { data: requestData } });
 *
 * // Ou use a função log diretamente
 * import { log } from "@/lib/logger";
 * await log("Mensagem personalizada", { level: "info", source: "custom" });
 */

export {};
