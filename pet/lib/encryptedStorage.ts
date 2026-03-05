/**
 * Utility para localStorage encriptado
 * Usa uma cifra simples baseada em XOR com chave derivada
 * Nota: Esta é uma proteção básica contra leitura casual
 * Para segurança real, usar encriptação no servidor
 */

const STORAGE_PREFIX = 'enc_';
const XOR_KEY = 'tamagochi-xor-key-2024';

// Função XOR simples para ofuscação
function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textChar ^ keyChar);
  }
  return result;
}

/**
 * Guardar dado encriptado no localStorage
 */
export function setEncryptedItem<T>(key: string, value: T): void {
  try {
    const stringValue = JSON.stringify(value);
    const encrypted = xorCipher(stringValue, XOR_KEY);
    // Codificar para base64 para evitar problemas com caracteres especiais
    const base64 = btoa(encrypted);
    localStorage.setItem(STORAGE_PREFIX + key, base64);
  } catch (error) {
    console.error('Erro ao guardar dado encriptado:', error);
    // Fallback: guardar sem encriptação
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
}

/**
 * Ler dado desencriptado do localStorage
 */
export function getEncryptedItem<T>(key: string, defaultValue: T | null = null): T | null {
  try {
    // Tentar ler versão encriptada
    const encrypted = localStorage.getItem(STORAGE_PREFIX + key);
    if (encrypted) {
      const decoded = atob(encrypted);
      const decrypted = xorCipher(decoded, XOR_KEY);
      return JSON.parse(decrypted) as T;
    }

    // Fallback: tentar ler versão não encriptada (para migração)
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      // Migrar para versão encriptada
      setEncryptedItem(key, parsed);
      localStorage.removeItem(key);
      return parsed;
    }

    return defaultValue;
  } catch (error) {
    console.error('Erro ao ler dado encriptado:', error);
    return defaultValue;
  }
}

/**
 * Remover dado do localStorage
 */
export function removeEncryptedItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    localStorage.removeItem(key); // Também remover versão não encriptada se existir
  } catch {}
}

/**
 * Limpar todos os itens encriptados
 */
export function clearEncryptedStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

/**
 * Hook React para localStorage encriptado
 */
export function useEncryptedStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  // Nota: Este hook requer que seja usado dentro de um componente cliente
  // Para uso direto, usar getEncryptedItem/setEncryptedItem
  const getValue = (): T => {
    if (typeof window === 'undefined') return defaultValue;
    return getEncryptedItem<T>(key, defaultValue) ?? defaultValue;
  };

  const setValue = (value: T) => {
    if (typeof window === 'undefined') return;
    setEncryptedItem(key, value);
  };

  return [getValue(), setValue];
}
