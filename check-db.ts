import { requirePrisma } from "./lib/prisma";

async function main() {
  const db = requirePrisma();
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, product: true, stage: true, designer: true, createdAt: true },
  });
  console.log("\n=== PROJECTS ===");
  console.table(projects);

  const events = await db.event.findMany({
    orderBy: { at: "desc" },
    take: 10,
    select: { projectId: true, actor: true, kind: true, at: true },
  });
  console.log("\n=== RECENT EVENTS ===");
  console.table(events);

  await db.$disconnect();
}

main();
