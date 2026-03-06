import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { decrypt } from "./encryption";

export async function validateSession() {
  try {
    const cookieStore = await cookies();
    const encryptedSession = cookieStore.get("person_session")?.value;

    if (!encryptedSession) {
      return null;
    }

    const decrypted = decrypt(encryptedSession);
    const sessionData = JSON.parse(decrypted);

    if (!sessionData?.code) {
      return null;
    }

    const person = await prisma.person.findUnique({
      where: { code: sessionData.code },
      select: {
        id: true,
        name: true,
        role: true,
        coins: true,
        code: true
      }
    });

    return person;
  } catch (error) {
    console.error("[validateSession] Erro:", error);
    return null;
  }
}

export async function requireAdmin() {
  const person = await validateSession();

  if (!person) {
    return null;
  }

  const role = (person.role ?? "").trim().toLowerCase();
  if (role !== "admin" && role !== "gestor") {
    return null;
  }

  return person;
}
