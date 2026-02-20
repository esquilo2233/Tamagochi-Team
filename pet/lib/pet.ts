import { prisma } from "./prisma";

type PetLike = {
  id?: number;
  hunger?: number;
  energy?: number;
  happiness?: number;
  hygiene?: number;
  life?: number;
  lastUpdate?: Date;
};

export async function getOrCreatePet() {
  // Sempre buscar o pet com id 1
  let pet = await prisma.pet.findUnique({ where: { id: 1 } });
  if (!pet) {
    pet = await prisma.pet.create({
      data: {
        id: 1,
        name: "Meu Pet",
        hunger: 100,
        energy: 100,
        happiness: 100,
        hygiene: 100,
        life: 100,
        // appearance será definido via API quando necessário
        appearance: null,
      },
    });
  }
  return pet;
}

/**
 * Atualiza o avatar do pet (caminho da imagem, ex: /avatars/avatar.png).
 */
export async function updatePetAvatar(avatarPath: string) {
  const pet = await getOrCreatePet();
  return prisma.pet.update({
    where: { id: pet.id },
    data: { appearance: avatarPath },
  });
}

/**
 * Award coins to a person (coins are stored per Person now).
 */
export async function awardCoinsToPerson(personId: number, amount: number, opts?: { game?: string; playerName?: string; score?: number }) {
  if (amount <= 0) return null;
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) return null;

  const newCoins = (person.coins ?? 0) + amount;

  const updatedPerson = await prisma.person.update({ where: { id: personId }, data: { coins: newCoins } });

  // record score when provided (associate player name if given)
  if (opts?.game) {
    try {
      await prisma.gameScore.create({ data: { game: opts.game, player: opts.playerName ?? person.name ?? 'anonymous', score: opts.score ?? 0 } });
    } catch (e) {
      // ignore logging errors
    }
  }

  return updatedPerson;
}

/**
 * Purchase an item with a person's coins and apply its effect to the pet.
 */
export async function purchaseItem(personId: number, itemId: number, petId: number) {
  const person = await prisma.person.findUnique({ where: { id: personId } });
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!person) throw new Error('person not found');
  if (!item) throw new Error('item not found');
  if (!pet) throw new Error('pet not found');

  if ((person.coins ?? 0) < item.price) {
    return { ok: false, error: 'insufficient_coins' };
  }

  // deduct coins and create purchase
  const updatedPerson = await prisma.person.update({ where: { id: personId }, data: { coins: (person.coins ?? 0) - item.price } });

  await prisma.purchase.create({ data: { petId, itemId, quantity: 1 } });

  // apply effect if present
  if (item.effect) {
    try {
      const effect = item.effect as Record<string, number>;
      await applyItemEffect(petId, effect);
    } catch (e) {
      // ignore
    }
  }

  return { ok: true, person: updatedPerson };
}

/**
 * Atualiza estado do pet com decaimento baseado no tempo passado.
 * Deve ser executado periodicamente (server-side) ou quando o usuário abrir a página.
 */
export async function updatePetState() {
  const pet = await getOrCreatePet();
  if (!pet) return null;

  const now = new Date();
  const last = pet.lastUpdate ?? new Date();
  const hoursPassed = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  if (hoursPassed < 1) return pet;

  const decay = Math.floor(hoursPassed);

  const hunger = Math.max((pet.hunger ?? 100) - decay * 5, 0);
  const energy = Math.max((pet.energy ?? 100) - decay * 3, 0);
  const happiness = Math.max((pet.happiness ?? 100) - decay * 2, 0);
  const hygiene = Math.max((pet.hygiene ?? 100) - decay * 2, 0);

  let life = pet.life ?? 100;
  if (hunger === 0) life = Math.max(life - decay * 5, 0);
  if (hygiene === 0) life = Math.max(life - decay * 3, 0);

  return prisma.pet.update({
    where: { id: pet.id },
    data: {
      hunger,
      energy,
      happiness,
      hygiene,
      life,
      lastUpdate: now,
    },
  });
}

export async function applyItemEffect(petId: number, effect: Record<string, number>) {
  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet) return null;

  const data: PetLike = {};
  if (typeof effect.hunger === "number") data.hunger = Math.min(100, (pet.hunger ?? 0) + effect.hunger);
  if (typeof effect.energy === "number") data.energy = Math.min(100, (pet.energy ?? 0) + effect.energy);
  if (typeof effect.happiness === "number") data.happiness = Math.min(100, (pet.happiness ?? 0) + effect.happiness);
  if (typeof effect.hygiene === "number") data.hygiene = Math.min(100, (pet.hygiene ?? 0) + effect.hygiene);
  if (typeof effect.life === "number") data.life = Math.min(100, (pet.life ?? 0) + effect.life);

  return prisma.pet.update({
    where: { id: petId },
    data: {
      hunger: data.hunger,
      energy: data.energy,
      happiness: data.happiness,
      hygiene: data.hygiene,
      life: data.life,
      lastUpdate: new Date(),
    },
  });
}

export async function performAction(petId: number, action: "feed" | "clean" | "play" | "sleep") {
  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet) return null;

  switch (action) {
    case "feed":
      return applyItemEffect(petId, { hunger: 20, happiness: 5 });
    case "clean":
      return applyItemEffect(petId, { hygiene: 30, happiness: 5 });
    case "play":
      return applyItemEffect(petId, { happiness: 15, energy: -10 });
    case "sleep":
      return applyItemEffect(petId, { energy: 30, hunger: -10 });
    default:
      return pet;
  }
}

// People (colleagues) management
export async function listPeople() {
  return prisma.person.findMany({ orderBy: { createdAt: "asc" } });
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1 para evitar confusão
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createPerson(name: string, role?: string) {
  let code: string;
  let exists = true;
  // Garantir código único
  while (exists) {
    code = generateCode();
    const existing = await prisma.person.findUnique({ where: { code } });
    if (!existing) exists = false;
  }
  return prisma.person.create({ data: { name, role, code: code! } });
}

export async function updatePerson(id: number, data: { name?: string; role?: string }) {
  return prisma.person.update({ where: { id }, data });
}

export async function deletePerson(id: number) {
  return prisma.person.delete({ where: { id } });
}

export async function getPersonByCode(code: string) {
  return prisma.person.findUnique({ where: { code } });
}

// Companion sessions: fazer companhia ao pet
export async function startCompanionSession(code: string) {
  const person = await getPersonByCode(code);
  if (!person) {
    throw new Error("Código inválido");
  }

  // Verificar se já existe sessão ativa
  const existing = await prisma.companionSession.findFirst({
    where: { personId: person.id, active: true },
  });

  if (existing) {
    return existing; // Retorna sessão existente
  }

  return prisma.companionSession.create({
    data: {
      personId: person.id,
      code,
      startedAt: new Date(),
      lastTickAt: new Date(),
      active: true,
      coinsEarned: 0,
    },
  });
}

export async function stopCompanionSession(sessionId: number) {
  return prisma.companionSession.update({
    where: { id: sessionId },
    data: { active: false },
  });
}

export async function processCompanionSessions() {
  const now = new Date();
  const sessions = await prisma.companionSession.findMany({ 
    where: { active: true },
    include: { person: true },
  });

  for (const s of sessions) {
    const last = s.lastTickAt ?? s.startedAt ?? new Date();
    const minutesPassed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60));
    const tickInterval = 5; // minutos por tick (moedas a cada 5 minutos)
    const ticks = Math.floor(minutesPassed / tickInterval);
    if (ticks <= 0) continue;

    const coinsPerTick = 1; // 1 moeda a cada 5 minutos
    const totalCoins = ticks * coinsPerTick;

    if (totalCoins > 0) {
      await awardCoinsToPerson(s.personId, totalCoins);
      
      // Atualizar sessão
      const advanced = new Date(last.getTime() + ticks * tickInterval * 60 * 1000);
      await prisma.companionSession.update({
        where: { id: s.id },
        data: {
          lastTickAt: advanced,
          coinsEarned: s.coinsEarned + totalCoins,
        },
      });
    }
  }
}

// Work sessions: start/stop and tick processing
export async function startWorkSession(petId: number, personId: number) {
  // Allow multiple concurrent work sessions for a pet (one pet can work with multiple people)
  return prisma.workSession.create({
    data: {
      petId,
      personId,
      startedAt: new Date(),
      lastTickAt: new Date(),
      active: true,
    },
  });
}

export async function stopWorkSession(sessionId: number) {
  return prisma.workSession.update({ where: { id: sessionId }, data: { active: false } });
}

/**
 * Processa todas as sessions ativas e aplica ticks de felicidade ao pet.
 * - Cada 15 minutos trabalhando com uma pessoa rende +2 de felicidade (configurável).
 */
export async function processWorkSessions() {
  const now = new Date();
  const sessions = await prisma.workSession.findMany({ where: { active: true } });

  for (const s of sessions) {
    const last = s.lastTickAt ?? s.startedAt ?? new Date();
    const minutesPassed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60));
    const tickInterval = 15; // minutos por tick
    const ticks = Math.floor(minutesPassed / tickInterval);
    if (ticks <= 0) continue;

    const happinessGainPerTick = 2;
    const totalGain = ticks * happinessGainPerTick;

    // apply to pet
    try {
      const pet = await prisma.pet.findUnique({ where: { id: s.petId } });
      if (!pet) {
        // stop session if pet missing
        await prisma.workSession.update({ where: { id: s.id }, data: { active: false } });
        continue;
      }

      const newHappiness = Math.min(100, (pet.happiness ?? 0) + totalGain);

      await prisma.pet.update({ where: { id: pet.id }, data: { happiness: newHappiness, lastUpdate: now } });

      // advance lastTickAt by ticks*interval minutes (keep remainder)
      const advanced = new Date(last.getTime() + ticks * tickInterval * 60 * 1000);
      await prisma.workSession.update({ where: { id: s.id }, data: { lastTickAt: advanced } });
    } catch (err) {
      // ignore single session errors but log, in real app use logger
      // console.error(err);
    }
  }
}

// integrate processWorkSessions into updatePetState: ensure work happiness is applied
export async function updatePetStateWithWork() {
  await processWorkSessions();
  await processCompanionSessions();
  return updatePetState();
}
