require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/client');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const NEW_SLUGS = [
  'unsc', 'unga', 'unhrc', 'csw', 'unicef', 'unep', 'wto',
  'aippm', 'lok-sabha', 'war-cabinet'
];

async function cleanup() {
  try {
    console.log('🧹 Cleaning up old committees...');

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
      select: { slug: true, name: true }
    });
    console.log(`\n📋 Remaining committees (${tracks.length}):`);
    tracks.forEach(t => console.log(`   • ${t.slug}: ${t.name}`));

    console.log('\n🎉 Cleanup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
