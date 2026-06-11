import { prisma } from "../src/lib/prisma";

const NEW_COMMITTEE_SLUGS = [
  "unsc", "unga", "unhrc", "csw", "unicef", "unep", "wto", 
  "aippm", "lok-sabha", "war-cabinet"
];

async function cleanup() {
  console.log("🧹 Starting cleanup of old committees and portfolios...");

  // Find and delete portfolios from old committees
  const oldPortfolios = await prisma.portfolio.findMany({
    where: {
      trackSlug: { notIn: NEW_COMMITTEE_SLUGS }
    }
  });

  if (oldPortfolios.length > 0) {
    console.log(`🗑️  Found ${oldPortfolios.length} portfolios from old committees`);
    await prisma.portfolio.deleteMany({
      where: { trackSlug: { notIn: NEW_COMMITTEE_SLUGS } }
    });
    console.log(`✅ Deleted ${oldPortfolios.length} old portfolios`);
  }

  // Find and delete old tracks
  const oldTracks = await prisma.track.findMany({
    where: {
      slug: { notIn: NEW_COMMITTEE_SLUGS }
    }
  });

  if (oldTracks.length > 0) {
    console.log(`🗑️  Found ${oldTracks.length} old committee tracks`);
    await prisma.track.deleteMany({
      where: { slug: { notIn: NEW_COMMITTEE_SLUGS } }
    });
    console.log(`✅ Deleted ${oldTracks.length} old tracks`);
  }

  // Verify new tracks exist
  const tracks = await prisma.track.findMany({
    where: { slug: { in: NEW_COMMITTEE_SLUGS } }
  });
  console.log(`✅ Remaining tracks: ${tracks.length}/${NEW_COMMITTEE_SLUGS.length}`);

  const portfolios = await prisma.portfolio.findMany({
    where: { archived: false }
  });
  console.log(`✅ Remaining portfolios: ${portfolios.length}`);

  console.log("🎉 Cleanup complete!");
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
