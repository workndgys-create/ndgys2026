import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const NEW_SLUGS = [
  'unsc', 'unga', 'unhrc', 'csw', 'unicef', 'unep', 'wto',
  'aippm', 'lok-sabha', 'war-cabinet', 'ipl'
];

async function main() {
  try {
    console.log('🧹 Cleaning up old committees...\n');

    // Delete portfolios from old committees
    const delPortfolios = await prisma.portfolio.deleteMany({
      where: { trackSlug: { notIn: NEW_SLUGS } }
    });
    console.log(`✅ Deleted ${delPortfolios.count} old portfolios`);

    // Delete old tracks
    const delTracks = await prisma.track.deleteMany({
      where: { slug: { notIn: NEW_SLUGS } }
    });
    console.log(`✅ Deleted ${delTracks.count} old tracks`);

    // List remaining tracks
    const tracks = await prisma.track.findMany({
      select: { slug: true, name: true },
      orderBy: { slug: 'asc' }
    });

    console.log(`\n📋 Remaining committees (${tracks.length}):`);
    tracks.forEach(t => console.log(`   • ${t.slug.padEnd(12)} ${t.name}`));

    console.log('\n🎉 Cleanup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
