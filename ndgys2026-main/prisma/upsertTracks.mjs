import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const TRACKS = [
  { slug: 'unsc', name: 'United Nations Security Council', fee: 2500, capacity: 15, agenda: 'Security and peacekeeping issues.', difficulty: 'Advanced' },
  { slug: 'unga', name: 'United Nations General Assembly', fee: 2000, capacity: 60, agenda: 'General multilateral discussions and global policy.', difficulty: 'Intermediate' },
  { slug: 'unhrc', name: 'United Nations Human Rights Council', fee: 2000, capacity: 50, agenda: 'Human rights protections and policy.', difficulty: 'Intermediate' },
  { slug: 'csw', name: 'United Nations Commission on the Status of Women', fee: 2000, capacity: 40, agenda: "Gender equality and women's rights.", difficulty: 'Intermediate' },
  { slug: 'unicef', name: "United Nations International Children's Emergency Fund", fee: 2000, capacity: 40, agenda: 'Child welfare and emergency response.', difficulty: 'Intermediate' },
  { slug: 'unep', name: 'United Nations Environment Programme', fee: 2000, capacity: 50, agenda: 'Environmental policy and sustainability.', difficulty: 'Intermediate' },
  { slug: 'wto', name: 'World Trade Organization', fee: 2500, capacity: 50, agenda: 'Global trade rules and disputes.', difficulty: 'Intermediate' },
  { slug: 'aippm', name: 'All India Political Parties Meet', fee: 1500, capacity: 60, agenda: 'National multiparty dialogue and consensus building.', difficulty: 'Beginner' },
  { slug: 'lok-sabha', name: 'Lok Sabha', fee: 1500, capacity: 60, agenda: 'Parliamentary debate and lawmaking.', difficulty: 'Beginner' },
  { slug: 'war-cabinet', name: 'Indian War Cabinet', fee: 1500, capacity: 30, agenda: 'Crisis governance and strategic decision-making.', difficulty: 'Advanced' }
];

async function main() {
  for (const t of TRACKS) {
    await prisma.track.upsert({
      where: { slug: t.slug },
      update: { name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty, archived: false },
      create: { slug: t.slug, name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty }
    });
    console.log('Upserted', t.slug);
  }
  console.log('Done upserting tracks.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
