import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

// Chave de encriptação (usar variável de ambiente em produção)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "tamagochi-default-key-change-in-prod!";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

// Derivar chave da password
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
}

/**
 * Encriptar texto
 */
export function encrypt(text: string): string {
  try {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);
    const key = deriveKey(ENCRYPTION_KEY, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Formato: salt:iv:authTag:encryptedData
    return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Erro ao encriptar:", error);
    return text; // Fallback para texto não encriptado
  }
}

/**
 * Desencriptar texto
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      return encryptedText; // Não está encriptado
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;

    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const key = deriveKey(ENCRYPTION_KEY, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Erro ao desencriptar:", error);
    return encryptedText; // Fallback
  }
}

/**
 * Encriptar objeto para JSON
 */
export function encryptObject<T extends object>(obj: T): string {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Desencriptar JSON para objeto
 */
export function decryptObject<T extends object>(
  encryptedText: string,
): T | null {
  try {
    const json = decrypt(encryptedText);
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Erro ao desencriptar objeto:", error);
    return null;
  }
}
