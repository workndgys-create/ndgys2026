import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { TRACKS } from "../src/lib/validation";

const COUNTRIES = [
  "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
  "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
  "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
  "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
];
const INDIAN_PARTIES = [
  "Bharatiya Janata Party", "Indian National Congress", "All India Majlis-e-Ittehaad-ul-Muslimeen",
  "Biju Janata Dal", "Trinamool Congress", "Dravida Munnetra Kazhagam", "Samajwadi Party",
  "Shivsena", "Telugu Desam Party", "Jharkhand Mukti Morcha", "Nationalist Congress Party",
  "Communist Party of India", "Aam Aadmi Party", "Yadav Samaj", "Regional Alliance"
];
const LOK_SABHA_SEATS = [
  "Mumbai (South)", "Delhi Central", "Bangalore South", "Chennai South", "Hyderabad",
  "Kolkata South", "Chandigarh", "Lucknow", "Pune", "Ahmedabad", "Jaipur", "Indore"
];
const WAR_CABINET_POSTS = [
  "Prime Minister", "Defence Minister", "Foreign Minister", "Finance Minister", "Home Minister",
  "Chief of Defence Staff", "Army Chief", "Navy Chief", "Air Chief", "National Security Advisor"
];
const IPL_TEAMS = [
  "Mumbai Indians", "Chennai Super Kings", "Royal Challengers Bangalore", "Kolkata Knight Riders",
  "Rajasthan Royals", "Delhi Capitals", "Punjab Kings", "Sunrisers Hyderabad"
];

function portfoliosFor(slug: string): string[] {
  if (slug === "aippm") return INDIAN_PARTIES;
  if (slug === "lok-sabha") return LOK_SABHA_SEATS;
  if (slug === "war-cabinet") return WAR_CABINET_POSTS;
  if (slug === "ipl") return IPL_TEAMS;
  return COUNTRIES;
}

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@nesummit.in";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN", active: true },
    create: { email, name: "Summit Admin", passwordHash, role: "SUPER_ADMIN" }
  });
  console.log(`OK Admin ready: ${email} (SUPER_ADMIN)`);

  const settings: Record<string, string> = { "home.published": "true", "allocations.live": "false", "registration.open": "true", "portfolio.holdMinutes": "10", "event.start": "2026-08-22T09:00:00+05:30", "event.end": "2026-08-23T17:30:00+05:30", "event.venue": "IIT Delhi, New Delhi" };
  for (const [key, value] of Object.entries(settings)) await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  console.log("OK Seeded settings (hold = 10 min)");

  for (const t of TRACKS) {
    await prisma.track.upsert({
      where: { slug: t.slug },
      update: { name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty },
      create: { slug: t.slug, name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty }
    });
  }
  console.log(`OK Seeded ${TRACKS.length} tracks`);
  // If UPSERT_ONLY is set, stop here to avoid destructive cleanup (useful for safe updates).
  if (process.env.UPSERT_ONLY) {
    console.log("UPSERT_ONLY set — tracks upserted, skipping portfolio deletion and track removals.");
    return;
  }

  // Clean up existing portfolios and ensure only the seeded tracks exist.
  await prisma.portfolio.deleteMany({});
  // Remove any tracks not in the new TRACKS set, then ensure the new tracks are present.
  const slugs = TRACKS.map((t) => t.slug);
  await prisma.track.deleteMany({ where: { slug: { notIn: slugs } } });
  for (const t of TRACKS) {
    // ensure track exists (upsert already used above) and mark as active
    await prisma.track.upsert({ where: { slug: t.slug }, update: { archived: false, name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty }, create: { slug: t.slug, name: t.name, fee: t.fee, capacity: t.capacity, agenda: t.agenda, difficulty: t.difficulty } });
  }
  console.log(`OK Tracks reset to ${TRACKS.length} committees and portfolios cleared`);

  const speakers = [
    { slug: "amb-rao", name: "Amb. Nirupama Rao", title: "Former Foreign Secretary", bio: "A career diplomat sharing insights on multilateral negotiation.", order: 0 },
    { slug: "dr-mehta", name: "Dr. Arjun Mehta", title: "Climate Policy Lead", bio: "Advises on energy transition and climate finance across South Asia.", order: 1 }
  ];
  for (const sp of speakers) await prisma.speaker.upsert({ where: { slug: sp.slug }, update: sp, create: sp });
  console.log("OK Seeded speakers");

  const events = [
    { slug: "opening-keynote", title: "Opening Keynote", kind: "keynote", summary: "A founding address on why youth diplomacy matters now.", venue: "Main Hall", published: true, order: 0 },
    { slug: "negotiation-workshop", title: "Workshop: The Art of Negotiation", kind: "workshop", summary: "A hands-on session on caucusing, blocs and resolution drafting.", venue: "Hall B", published: true, order: 1 }
  ];
  for (const ev of events) await prisma.event.upsert({ where: { slug: ev.slug }, update: ev, create: ev });
  console.log("OK Seeded events");

  // Clear any previously-seeded sample competitions so the lineup matches the current roster
  await prisma.competition.deleteMany({ where: { slug: { in: ["group-dance", "battle-of-bands"] } } });

const competitions = [
  { slug: "best-delegate", title: "Best Delegate Awards", category: "Recognition", summary: "Awarded across every committee to delegates who lead the floor.", prize: "Trophy + certificate", published: true, order: 0, format: "SOLO", registrationOpen: false },
  { slug: "shaam-e-mehfil", title: "Shaam-e-Mehfil", category: "Cultural", summary: "A solo showcase — classical or contemporary.", prize: "Rs 10,000", published: true, order: 1, format: "SOLO", feeSolo: 179900, registrationOpen: true, questionsText: "What is your performance form?" },
  { slug: "sur-aur-taal", title: "Sur Aur Taal", category: "Cultural", summary: "A solo singing showcase.", prize: "Rs 10,000", published: true, order: 2, format: "SOLO", feeSolo: 179900, registrationOpen: true },
  { slug: "nazarana", title: "Nazarana", category: "Cultural", summary: "A team cultural performance showcase.", prize: "Rs 30,000", published: true, order: 3, format: "GROUP", feeGroup: 479900, minTeam: 6, maxTeam: 6, registrationOpen: true },
  { slug: "beat-breakout", title: "Beat Breakout", category: "Cultural", summary: "A high-energy team dance battle.", prize: "Rs 20,000", published: true, order: 4, format: "GROUP", feeGroup: 399900, minTeam: 8, maxTeam: 8, registrationOpen: true },
  { slug: "battle-of-bands", title: "Battle of Bands", category: "Cultural", summary: "A team music battle — bring your band and perform.", prize: "Rs 25,000", published: true, order: 5, format: "GROUP", feeGroup: 399900, minTeam: 8, maxTeam: 8, registrationOpen: true },
  { slug: "stock-sense", title: "Stock Sense", category: "Finance", summary: "A solo simulation testing your market instincts.", prize: "Rs 15,000", published: true, order: 6, format: "SOLO", feeSolo: 199900, registrationOpen: true },
  { slug: "greenovation-showdown", title: "Greenovation Showdown", category: "Sustainability", summary: "Team pitch battle for the best sustainability innovation.", prize: "Rs 25,000", published: true, order: 7, format: "BOTH", feeSolo: 179900, feeGroup: 399900, minTeam: 2, maxTeam: 5, registrationOpen: true, questionsText: "What is your pitch idea?" },
  { slug: "spark-tank", title: "Spark Tank", category: "Business", summary: "Pitch your startup to a panel of investors, Shark-Tank style.", prize: "Rs 30,000", published: true, order: 8, format: "BOTH", feeSolo: 179900, feeGroup: 399900, minTeam: 2, maxTeam: 5, registrationOpen: true, questionsText: "What is your pitch idea?" },
  { slug: "marketing-mayhem", title: "Marketing Mayhem", category: "Business", summary: "Pitch a campaign — enter solo or as a team.", prize: "Rs 20,000", published: true, order: 9, format: "BOTH", feeSolo: 179900, feeGroup: 399900, minTeam: 2, maxTeam: 5, registrationOpen: true },
  { slug: "ipl-auction", title: "IPL Auction", category: "Strategy", summary: "Build your dream XI in a fast-paced team auction.", prize: "Rs 20,000", published: true, order: 10, format: "GROUP", feeGroup: 439900, minTeam: 2, maxTeam: 5, registrationOpen: true },
  { slug: "film-making", title: "Film Making", category: "Creative", summary: "A short-film challenge. Details and registration coming soon.", prize: "Rs 30,000", published: true, order: 11, format: "GROUP", minTeam: 2, maxTeam: 5, registrationOpen: false },
];
  for (const c of competitions) await prisma.competition.upsert({ where: { slug: c.slug }, update: c, create: c });
  console.log("OK Seeded competitions (incl. solo/group cultural events)");

  const promos = [
    { code: "EARLYBIRD", kind: "PERCENT", value: 15, maxUses: 200, appliesTo: null as string | null, active: true },
    { code: "SCHOOL25", kind: "PERCENT", value: 25, maxUses: null as number | null, appliesTo: null as string | null, active: true },
    { code: "DELHI500", kind: "FLAT", value: 50000, maxUses: 100, appliesTo: null as string | null, active: true }
  ];
  for (const pc of promos) await prisma.promoCode.upsert({ where: { code: pc.code }, update: pc, create: pc });
  console.log(`OK Seeded ${promos.length} promo codes`);

  const schedule = [
    { day: 1, startTime: "09:00", endTime: "10:00", title: "Registration & Opening Ceremony", room: "Main Hall", order: 0, published: true },
    { day: 1, startTime: "10:15", endTime: "13:00", title: "Committee Session I", order: 1, published: true },
    { day: 1, startTime: "14:00", endTime: "17:00", title: "Committee Session II", order: 2, published: true },
    { day: 2, startTime: "09:30", endTime: "12:30", title: "Committee Session III", order: 3, published: true },
    { day: 2, startTime: "16:00", endTime: "17:30", title: "Closing & Awards", room: "Main Hall", order: 4, published: true }
  ];
  await prisma.scheduleItem.deleteMany({});
  for (const s of schedule) await prisma.scheduleItem.create({ data: s });
  console.log("OK Seeded event flow");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
