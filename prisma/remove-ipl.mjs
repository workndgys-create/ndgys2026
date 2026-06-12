import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Searching for tracks named/slugged like IPL...');
  const matches = await prisma.track.findMany({
    where: {
      OR: [
        { slug: 'ipl' },
        { slug: { contains: 'ipl', mode: 'insensitive' } },
        { name: { contains: 'indian premier league', mode: 'insensitive' } }
      ]
    }
  });

  if (matches.length === 0) {
    console.log('No matching tracks found. Nothing to remove.');
    return;
  }

  console.log(`Found ${matches.length} track(s):`);
  for (const t of matches) console.log(` - ${t.slug}: ${t.name}`);

  // Confirm destructive action via environment variable
  if (process.env.CONFIRM !== 'yes') {
    console.log('\nThis is a destructive operation. To proceed, re-run with CONFIRM=yes in the environment.');
    console.log('Example (PowerShell): $env:CONFIRM = "yes"; $env:DATABASE_URL = "<your_db>"; node prisma/remove-ipl.mjs');
    return;
  }

  for (const t of matches) {
    console.log(`\nDeleting portfolios for track ${t.slug}...`);
    const delP = await prisma.portfolio.deleteMany({ where: { trackSlug: t.slug } });
    console.log(`  Deleted ${delP.count} portfolios.`);

    console.log(`Deleting registrations that reference this track (if any)...`);
    const delR = await prisma.registration.deleteMany({ where: { trackSlug: t.slug } });
    console.log(`  Deleted ${delR.count} registrations.`);

    console.log(`Deleting track ${t.slug}...`);
    await prisma.track.delete({ where: { id: t.id } });
    console.log('  Track deleted.');
  }

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
