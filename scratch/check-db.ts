import { prisma } from "../src/lib/prisma";

async function main() {
  const comps = await prisma.competition.findMany({ orderBy: { order: "asc" } });
  console.log("=== Competitions ===");
  comps.forEach(c => {
    console.log(`- Slug: ${c.slug} | Title: ${c.title} | Category: ${c.category} | Summary: ${c.summary}`);
  });

  const tracks = await prisma.track.findMany({ orderBy: { createdAt: "asc" } });
  console.log("\n=== Tracks ===");
  tracks.forEach(t => {
    console.log(`- Slug: ${t.slug} | Name: ${t.name}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
