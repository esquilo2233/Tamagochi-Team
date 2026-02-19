import { prisma } from "./prisma";

export async function updatePetState() {
  const pet = await prisma.pet.findUnique({ where: { id: 1 } });
  if (!pet) return null;

  const now = new Date();
  const hoursPassed =
    (now.getTime() - pet.lastUpdate.getTime()) / (1000 * 60 * 60);

  if (hoursPassed < 1) return pet;

  const decay = Math.floor(hoursPassed);

  const hunger = Math.max(pet.hunger - decay * 5, 0);
  const energy = Math.max(pet.energy - decay * 3, 0);
  const happiness = Math.max(pet.happiness - decay * 2, 0);

  let health = pet.health;
  if (hunger === 0) {
    health = Math.max(health - decay * 5, 0);
  }

  return prisma.pet.update({
    where: { id: 1 },
    data: {
      hunger,
      energy,
      happiness,
      health,
      lastUpdate: now,
    },
  });
}
