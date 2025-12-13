import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Seed Simulation Configurations
  console.log("📋 Seeding simulation configurations...");

  const configs = [
    {
      name: "Standard",
      description: "Esperienza completa con 10 decisioni e 3 sfide principali. Ideale per una simulazione approfondita.",
      tasksCount: 10,
      challengesCount: 3,
      difficulty: "medium",
      timelineType: "standard",
      contextType: "startup",
      isDefault: true,
      isActive: true,
    },
    {
      name: "Quick",
      description: "Versione rapida con 5 decisioni e 1 sfida. Perfetta per una panoramica veloce.",
      tasksCount: 5,
      challengesCount: 1,
      difficulty: "easy",
      timelineType: "quick",
      contextType: "startup",
      isDefault: false,
      isActive: true,
    },
    {
      name: "Extended",
      description: "Simulazione estesa con 15 decisioni e 5 sfide. Per chi vuole un'esperienza approfondita.",
      tasksCount: 15,
      challengesCount: 5,
      difficulty: "hard",
      timelineType: "extended",
      contextType: "startup",
      isDefault: false,
      isActive: true,
    },
    {
      name: "Enterprise Challenge",
      description: "Scenario enterprise con complessità organizzativa elevata.",
      tasksCount: 12,
      challengesCount: 4,
      difficulty: "hard",
      timelineType: "standard",
      contextType: "enterprise",
      isDefault: false,
      isActive: true,
    },
  ];

  for (const config of configs) {
    const existingConfig = await prisma.simulationConfig.findFirst({
      where: { name: config.name },
    });

    if (existingConfig) {
      console.log(`  ✓ Config "${config.name}" already exists, skipping...`);
    } else {
      await prisma.simulationConfig.create({
        data: config,
      });
      console.log(`  ✓ Created config: ${config.name}`);
    }
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
