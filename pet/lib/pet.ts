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

const SYSTEM_DECAY_CONFIG_NAME = "__system_decay_config__";

type DecayConfig = {
  hungerDecayPerMinute: number;
  energyDecayPerMinute: number;
  happinessDecayPerMinute: number;
  hygieneDecayPerMinute: number;
  lifeDecayWhenHungerZeroPerMinute: number;
  lifeDecayWhenEnergyZeroPerMinute: number;
  lifeDecayWhenHygieneZeroPerMinute: number;
  lowAttentionEnabled: boolean;
  lowAttentionStartHour: number;
  lowAttentionEndHour: number;
  lowAttentionDecayMultiplier: number;
};

export const DEFAULT_DECAY_CONFIG: DecayConfig = {
  hungerDecayPerMinute: 0.5,
  energyDecayPerMinute: 0.3,
  happinessDecayPerMinute: 0.45,
  hygieneDecayPerMinute: 0.2,
  lifeDecayWhenHungerZeroPerMinute: 0.5,
  lifeDecayWhenEnergyZeroPerMinute: 0.4,
  lifeDecayWhenHygieneZeroPerMinute: 0.3,
  lowAttentionEnabled: true,
  lowAttentionStartHour: 16,
  lowAttentionEndHour: 9,
  lowAttentionDecayMultiplier: 0.08,
};

function clampHour(v: number, fallback: number) {
  if (!Number.isFinite(v)) return fallback;
  const n = Math.floor(v);
  return Math.max(0, Math.min(23, n));
}

function clampNonNegative(v: number, fallback: number) {
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, v);
}

function parseDecayConfig(raw: unknown): DecayConfig {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    hungerDecayPerMinute: clampNonNegative(Number(source.hungerDecayPerMinute), DEFAULT_DECAY_CONFIG.hungerDecayPerMinute),
    energyDecayPerMinute: clampNonNegative(Number(source.energyDecayPerMinute), DEFAULT_DECAY_CONFIG.energyDecayPerMinute),
    happinessDecayPerMinute: clampNonNegative(Number(source.happinessDecayPerMinute), DEFAULT_DECAY_CONFIG.happinessDecayPerMinute),
    hygieneDecayPerMinute: clampNonNegative(Number(source.hygieneDecayPerMinute), DEFAULT_DECAY_CONFIG.hygieneDecayPerMinute),
    lifeDecayWhenHungerZeroPerMinute: clampNonNegative(Number(source.lifeDecayWhenHungerZeroPerMinute), DEFAULT_DECAY_CONFIG.lifeDecayWhenHungerZeroPerMinute),
    lifeDecayWhenEnergyZeroPerMinute: clampNonNegative(Number(source.lifeDecayWhenEnergyZeroPerMinute), DEFAULT_DECAY_CONFIG.lifeDecayWhenEnergyZeroPerMinute),
    lifeDecayWhenHygieneZeroPerMinute: clampNonNegative(Number(source.lifeDecayWhenHygieneZeroPerMinute), DEFAULT_DECAY_CONFIG.lifeDecayWhenHygieneZeroPerMinute),
    lowAttentionEnabled: source.lowAttentionEnabled === undefined ? DEFAULT_DECAY_CONFIG.lowAttentionEnabled : Boolean(source.lowAttentionEnabled),
    lowAttentionStartHour: clampHour(Number(source.lowAttentionStartHour), DEFAULT_DECAY_CONFIG.lowAttentionStartHour),
    lowAttentionEndHour: clampHour(Number(source.lowAttentionEndHour), DEFAULT_DECAY_CONFIG.lowAttentionEndHour),
    lowAttentionDecayMultiplier: clampNonNegative(Number(source.lowAttentionDecayMultiplier), DEFAULT_DECAY_CONFIG.lowAttentionDecayMultiplier),
  };
}

function isHourInsideWindow(hour: number, startHour: number, endHour: number) {
  if (startHour === endHour) return true;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

export async function getDecayConfig(): Promise<DecayConfig> {
  const systemItem = await prisma.item.findFirst({
    where: { type: "__system", name: SYSTEM_DECAY_CONFIG_NAME },
  });
  return parseDecayConfig(systemItem?.effect ?? DEFAULT_DECAY_CONFIG);
}

export async function saveDecayConfig(input: Partial<DecayConfig>) {
  const current = await getDecayConfig();
  const merged = parseDecayConfig({ ...current, ...input });

  const existing = await prisma.item.findFirst({
    where: { type: "__system", name: SYSTEM_DECAY_CONFIG_NAME },
  });

  if (existing) {
    await prisma.item.update({
      where: { id: existing.id },
      data: { effect: merged, price: 0 },
    });
  } else {
    await prisma.item.create({
      data: {
        name: SYSTEM_DECAY_CONFIG_NAME,
        type: "__system",
        price: 0,
        effect: merged,
      },
    });
  }

  return merged;
}

export async function getOrCreatePet() {
  // Sempre buscar o pet com id 1
  let pet = await prisma.pet.findUnique({ where: { id: 1 } });
  if (!pet) {
    pet = await prisma.pet.create({
      data: {
        id: 1,
        name: "Samurai",
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

  return { ok: true, person: updatedPerson };
}

export async function listFoodInventory(petId: number) {
  const purchases = await prisma.purchase.findMany({ where: { petId }, orderBy: { boughtAt: "asc" } });
  if (purchases.length === 0) return [];

  const itemIds = Array.from(new Set(purchases.map((p) => p.itemId)));
  const items = await prisma.item.findMany({ where: { id: { in: itemIds } } });

  const countByItemId = purchases.reduce<Record<number, number>>((acc, p) => {
    acc[p.itemId] = (acc[p.itemId] ?? 0) + (p.quantity ?? 1);
    return acc;
  }, {});

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    effect: item.effect,
    price: item.price,
    quantity: countByItemId[item.id] ?? 0,
  })).filter((item) => item.quantity > 0);
}

export async function consumeFoodItem(petId: number, itemId: number) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return { ok: false, error: "item_not_found" };
  }

  const purchase = await prisma.purchase.findFirst({
    where: { petId, itemId },
    orderBy: { boughtAt: "asc" },
  });

  if (!purchase) {
    return { ok: false, error: "item_not_owned" };
  }

  await prisma.purchase.delete({ where: { id: purchase.id } });

  const updatedPet = await applyItemEffect(petId, (item.effect as Record<string, number>) ?? {});
  return { ok: true, pet: updatedPet };
}

/**
 * Atualiza estado do pet com decaimento baseado no tempo passado.
 * Se o pet estiver a dormir, aplica recuperação gradual (energia sobe).
 */
export async function updatePetState() {
  const pet = await getOrCreatePet();
  if (!pet) return null;
  const decayConfig = await getDecayConfig();

  const now = new Date();
  const lisboaHour = Number(
    new Intl.DateTimeFormat("pt-PT", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Lisbon",
    }).format(now)
  );
  const isLowAttentionWindow = decayConfig.lowAttentionEnabled
    ? isHourInsideWindow(lisboaHour, decayConfig.lowAttentionStartHour, decayConfig.lowAttentionEndHour)
    : false;
  const lowAttentionDecayMultiplier = isLowAttentionWindow ? decayConfig.lowAttentionDecayMultiplier : 1;
  const last = pet.lastUpdate ?? new Date();
  const minutesPassed = (now.getTime() - last.getTime()) / (1000 * 60);
  
  if (minutesPassed < 1) return pet;

  const sleepStartedAt = (pet as { sleepStartedAt?: Date | null }).sleepStartedAt;

  if (sleepStartedAt) {
    // Pet a dormir: recuperação acelerada
    // Objetivo: energia chegar a 100 em no máximo 1 minuto
    // Por minuto: energia +100, felicidade +0.5, fome -1.2, higiene -0.6
    const energyGain = minutesPassed * 100;
    const happinessGain = minutesPassed * 0.5;
    const hungerDecay = minutesPassed * 1.2 * lowAttentionDecayMultiplier;
    const hygieneDecay = minutesPassed * 0.6 * lowAttentionDecayMultiplier;

    let energy = Math.min(100, (pet.energy ?? 0) + energyGain);
    const happiness = Math.min(100, (pet.happiness ?? 0) + happinessGain);
    const hunger = Math.max(0, (pet.hunger ?? 100) - hungerDecay);
    const hygiene = Math.max(0, (pet.hygiene ?? 100) - hygieneDecay);
    const life = pet.life ?? 100;

    // Acordar quando energia chegar a 100
    const newSleepStartedAt = energy >= 100 ? null : sleepStartedAt;

    return prisma.pet.update({
      where: { id: pet.id },
      data: {
        hunger: Math.round(hunger),
        energy: Math.round(energy),
        happiness: Math.round(happiness),
        hygiene,
        life,
        lastUpdate: now,
        sleepStartedAt: newSleepStartedAt,
      },
    });
  }

  // Pet acordado: decaimento normal
  const hungerDecay = minutesPassed * decayConfig.hungerDecayPerMinute * lowAttentionDecayMultiplier;
  const energyDecay = minutesPassed * decayConfig.energyDecayPerMinute * lowAttentionDecayMultiplier;
  const happinessDecay = minutesPassed * decayConfig.happinessDecayPerMinute * lowAttentionDecayMultiplier;
  const hygieneDecay = minutesPassed * decayConfig.hygieneDecayPerMinute * lowAttentionDecayMultiplier;

  const hunger = Math.max((pet.hunger ?? 100) - hungerDecay, 0);
  const energy = Math.max((pet.energy ?? 100) - energyDecay, 0);
  const happiness = Math.max((pet.happiness ?? 100) - happinessDecay, 0);
  const hygiene = Math.max((pet.hygiene ?? 100) - hygieneDecay, 0);

  let life = pet.life ?? 100;
  if (hunger === 0) life = Math.max(life - minutesPassed * decayConfig.lifeDecayWhenHungerZeroPerMinute * lowAttentionDecayMultiplier, 0);
  if (energy === 0) life = Math.max(life - minutesPassed * decayConfig.lifeDecayWhenEnergyZeroPerMinute * lowAttentionDecayMultiplier, 0);
  if (hygiene === 0) life = Math.max(life - minutesPassed * decayConfig.lifeDecayWhenHygieneZeroPerMinute * lowAttentionDecayMultiplier, 0);

  return prisma.pet.update({
    where: { id: pet.id },
    data: {
      hunger: Math.round(hunger),
      energy: Math.round(energy),
      happiness: Math.round(happiness),
      hygiene: Math.round(hygiene),
      life: Math.round(life),
      lastUpdate: now,
    },
  });
}

export async function applyItemEffect(petId: number, effect: Record<string, number>) {
  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet) return null;

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  const data: PetLike = {};
  if (typeof effect.hunger === "number") data.hunger = clamp((pet.hunger ?? 0) + effect.hunger);
  if (typeof effect.energy === "number") data.energy = clamp((pet.energy ?? 0) + effect.energy);
  if (typeof effect.happiness === "number") data.happiness = clamp((pet.happiness ?? 0) + effect.happiness);
  if (typeof effect.hygiene === "number") data.hygiene = clamp((pet.hygiene ?? 0) + effect.hygiene);
  if (typeof effect.life === "number") data.life = clamp((pet.life ?? 0) + effect.life);

  return prisma.pet.update({
    where: { id: petId },
    data: {
      ...(data.hunger !== undefined && { hunger: data.hunger }),
      ...(data.energy !== undefined && { energy: data.energy }),
      ...(data.happiness !== undefined && { happiness: data.happiness }),
      ...(data.hygiene !== undefined && { hygiene: data.hygiene }),
      ...(data.life !== undefined && { life: data.life }),
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
      return prisma.pet.update({
        where: { id: petId },
        data: { sleepStartedAt: new Date(), lastUpdate: new Date() },
      });
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
  await prisma.companionSession.deleteMany({ where: { personId: id } });
  await prisma.workSession.deleteMany({ where: { personId: id } });
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

  const pet = await getOrCreatePet();
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  for (const s of sessions) {
    const last = s.lastTickAt ?? s.startedAt ?? new Date();
    const minutesPassed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60));
    const tickInterval = 5; // minutos por tick (moedas a cada 5 minutos)
    const ticks = Math.floor(minutesPassed / tickInterval);
    if (ticks <= 0) continue;

    const coinsPerTick = 1; // 1 moeda a cada 5 minutos
    const totalCoins = ticks * coinsPerTick;

    // Enquanto faz companhia:
    // - Felicidade sobe
    // - Fome/Energia/Higiene descem lentamente
    const happinessGainPerTick = 1;
    const hungerDecayPerTick = 0.4;
    const energyDecayPerTick = 0.35;
    const hygieneDecayPerTick = 0.25;

    const totalHappinessGain = ticks * happinessGainPerTick;
    const totalHungerDecay = ticks * hungerDecayPerTick;
    const totalEnergyDecay = ticks * energyDecayPerTick;
    const totalHygieneDecay = ticks * hygieneDecayPerTick;

    const nextHappiness = clamp((pet.happiness ?? 100) + totalHappinessGain);
    const nextHunger = clamp((pet.hunger ?? 100) - totalHungerDecay);
    const nextEnergy = clamp((pet.energy ?? 100) - totalEnergyDecay);
    const nextHygiene = clamp((pet.hygiene ?? 100) - totalHygieneDecay);

    await prisma.pet.update({
      where: { id: pet.id },
      data: {
        happiness: nextHappiness,
        hunger: nextHunger,
        energy: nextEnergy,
        hygiene: nextHygiene,
        lastUpdate: now,
      },
    });

    pet.happiness = nextHappiness;
    pet.hunger = nextHunger;
    pet.energy = nextEnergy;
    pet.hygiene = nextHygiene;

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
