import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { TRACKS } from "../src/lib/validation";

const COUNTRIES = [
  "United States", "United Kingdom", "France", "Russia", "China", "India", "Brazil", "South Africa",
  "Germany", "Japan", "Canada", "Australia", "Mexico", "Indonesia", "Nigeria", "Kenya",
  "Saudi Arabia", "Turkey", "Egypt", "Argentina", "Italy", "Spain", "South Korea", "Pakistan",
  "Bangladesh", "Vietnam", "Iran", "Israel", "Ukraine", "Poland"
];

const PRESS_ROLES = [
  "Reuters - Correspondent", "Associated Press - Correspondent", "BBC - Correspondent", "Al Jazeera - Correspondent",
  "The Hindu - Correspondent", "Photojournalist I", "Photojournalist II", "Caricaturist I", "Caricaturist II",
  "Editor-in-Chief", "Deputy Editor", "Social Media Lead"
];

const CRISIS_ROLES = [
  "Head of State", "Minister of Defence", "Minister of Foreign Affairs", "Minister of Finance",
  "Intelligence Chief", "Army Chief", "Navy Chief", "Air Chief", "National Security Advisor",
  "Chief of Staff", "Cabinet Secretary", "Press Secretary"
];

const LEADERSHIP_ROLES = [
  "Secretary-General", "Deputy Secretary-General", "President of the Assembly", "Special Envoy I",
  "Special Envoy II", "Bloc Leader - West", "Bloc Leader - East", "Bloc Leader - Non-Aligned",
  "Rapporteur", "Legal Counsel", "Chief Negotiator", "Observer"
];

const ENTRE_ROLES = Array.from({ length: 20 }, (_, i) => `Founder Seat ${i + 1}`);

const INDIAN_PARTIES = [
  "Bharatiya Janata Party", "Indian National Congress", "All India Majlis-e-Ittehaad-ul-Muslimeen",
  "Biju Janata Dal", "Trinamool Congress", "Dravida Munnetra Kazhagam", "Samajwadi Party",
  "Shivsena", "Telugu Desam Party", "Jharkhand Mukti Morcha", "Nationalist Congress Party",
  "Communist Party of India", "Aam Aadmi Party", "Yadav Samaj", "Regional Alliance"
];

const LOK_SABHA_SEATS = [
  "Bharatiya Janata Party", "Indian National Congress", "All India Majlis-e-Ittehaad-ul-Muslimeen",
  "Biju Janata Dal", "Trinamool Congress", "Dravida Munnetra Kazhagam", "Samajwadi Party",
  "Shivsena", "Telugu Desam Party", "Jharkhand Mukti Morcha", "Nationalist Congress Party",
  "Communist Party of India", "Aam Aadmi Party", "Yadav Samaj", "Regional Alliance"
];

const WAR_CABINET_POSTS = [
  "Prime Minister", "Defence Minister", "Foreign Minister", "Finance Minister", "Home Minister",
  "Chief of Defence Staff", "Army Chief", "Navy Chief", "Air Chief", "National Security Advisor"
];


function numbered(prefix: string, count: number) {
  return Array.from({ length: count }, (_, idx) => `${prefix} ${String(idx + 1).padStart(2, "0")}`);
}

const INTERNATIONAL_PRESS_PORTFOLIOS = [
  ...numbered("Journalist", 50),
  ...numbered("Caricaturist", 50),
  ...numbered("Photographer", 30)
];

function portfoliosFor(slug: string): string[] {
  if (slug === "international-press") return INTERNATIONAL_PRESS_PORTFOLIOS;
  if (slug === "press") return PRESS_ROLES;
  if (slug === "crisis") return CRISIS_ROLES;
  if (slug === "leadership") return LEADERSHIP_ROLES;
  if (slug === "entrepreneurship") return ENTRE_ROLES;
  if (slug === "aippm") return INDIAN_PARTIES;
  if (slug === "lok-sabha") return LOK_SABHA_SEATS;
  if (slug === "war-cabinet") return WAR_CABINET_POSTS;
  // no dedicated IPL committee — IPL is a competition handled via `ipl-auction`
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

  const settings: Record<string, string> = {
    "home.published": "true",
    "allocations.live": "false",
    "registration.open": "true",
    "portfolio.holdMinutes": "10",
    "event.start": "2026-08-22T09:00:00+05:30",
    "event.end": "2026-08-23T17:30:00+05:30",
    "event.venue": "IIT Delhi, New Delhi"
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("OK Seeded settings (hold = 10 min)");

  

  const slugs = TRACKS.map((t) => t.slug);

// Archive removed tracks instead of deleting them
await prisma.track.updateMany({
  where: {
    slug: {
      notIn: slugs
    }
  },
  data: {
    archived: true
  }
});

// Upsert active tracks
for (const t of TRACKS) {
  await prisma.track.upsert({
    where: {
      slug: t.slug
    },
    update: {
      archived: false,
      name: t.name,
      fee: t.fee,
      capacity: t.capacity,
      agenda: t.agenda,
      description: t.description,
      difficulty: t.difficulty
    },
    create: {
      slug: t.slug,
      name: t.name,
      fee: t.fee,
      capacity: t.capacity,
      agenda: t.agenda,
      description: t.description,
      difficulty: t.difficulty
    }
  });
}

console.log(`OK Synced ${TRACKS.length} tracks`);

// Add only missing portfolios
for (const t of TRACKS) {
  const portfolios = portfoliosFor(t.slug);

  await prisma.portfolio.createMany({
    data: portfolios.map((name, i) => ({
      name,
      trackSlug: t.slug,
      order: i,
      status: "AVAILABLE"
    })),
    skipDuplicates: true
  });
}

console.log("OK Portfolios synced safely");

  


  
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

  await prisma.competition.deleteMany({ where: { slug: { in: ["group-dance", "battle-of-bands"] } } });

  const competitions = [
    { 
      slug: "best-delegate", 
      title: "Best Delegate Awards", 
      category: "Recognition", 
      summary: "Awarded across every committee to delegates who lead the floor.", 
      description: "Recognizing outstanding diplomacy, leadership, and collaboration. The Best Delegate Awards are presented at the closing ceremony to the delegates who demonstrate exceptional research, strategic negotiations, and structural consensus building in their respective committees.",
      prize: "Trophy + certificate", 
      published: true, 
      order: 0, 
      format: "SOLO", 
      registrationOpen: false 
    },
    { 
      slug: "shaam-e-mehfil", 
      title: "Shaam-e-Mehfil", 
      category: "Cultural", 
      summary: "A solo showcase — classical or contemporary.", 
      description: "Shaam-e-Mehfil is a soulful and prestigious dance competition that invites you to step into the spotlight and celebrate the majestic heritage of Indian Classical Dance. Designed for performers of all levels, this artistic platform challenges you to push your creative boundaries, showcase your choreography, and capture the hearts of a live audience. It offers the ultimate stage to gain invaluable performance experience, receive feedback from esteemed judges, and connect with a vibrant community dedicated to cultural storytelling. Embrace the rhythms of tradition and let your passion grace the stage!",
      prize: "Rs 10,000", 
      published: true, 
      order: 1, 
      format: "SOLO", 
      feeSolo: 179900, 
      registrationOpen: true, 
      questionsText: "What is your performance form?" 
    },
    { 
      slug: "sur-aur-taal", 
      title: "Sur Aur Taal", 
      category: "Cultural", 
      summary: "A solo singing showcase.", 
      description: "Sur Aur Taal is a premier vocal arena that invites you to command the stage and celebrate the power of musical storytelling. Designed for vocalists across all genres, this captivating platform challenges you to push your artistic boundaries, deliver spellbinding performances, and enchant a live audience. It serves as the ultimate launchpad to refine your acoustic expression, secure invaluable critiques from industry professionals, and unite with a passionate community of fellow artists. Embrace the melody, unleash your unique sound, and take center stage!",
      prize: "Rs 10,000", 
      published: true, 
      order: 2, 
      format: "SOLO", 
      feeSolo: 179900, 
      registrationOpen: true 
    },
    { 
      slug: "nazarana", 
      title: "Nazarana", 
      category: "Cultural", 
      summary: "A team cultural performance showcase.", 
      description: "Nazarana is a premier team cultural performance showcase celebrating diversity, rhythm, and expression. Teams will compete to display harmonious choreography, vibrant costuming, and powerful storytelling that captivates both the audience and our expert panel of judges.",
      prize: "Rs 30,000", 
      published: true, 
      order: 3, 
      format: "GROUP", 
      feeGroup: 479900, 
      minTeam: 6, 
      maxTeam: 6, 
      registrationOpen: true 
    },
    { 
      slug: "beat-breakout", 
      title: "Beat Breakout", 
      category: "Cultural", 
      summary: "A high-energy team dance battle.", 
      description: "Beat Breakout is a high-octane, synchronized dance arena that challenges your crew to push the limits of contemporary choreography and street style. Designed for western dance teams, this competition demands absolute precision, explosive energy, and seamless formations to dominate the stage, allowing a maximum of 8 participants per crew to compete. It provides the ultimate platform to fuse intricate rhythms, showcase your crew's unique identity, and captivate both the audience and a panel of expert judges. Bring your ultimate choreography, command the stage, and leave your mark on the floor!",
      prize: "Rs 20,000", 
      published: true, 
      order: 4, 
      format: "GROUP", 
      feeGroup: 399900, 
      minTeam: 8, 
      maxTeam: 8, 
      registrationOpen: true 
    },
    { 
      slug: "battle-of-bands", 
      title: "Battle of Bands", 
      category: "Cultural", 
      summary: "A team music battle — bring your band and perform.", 
      description: "Bandish is a high-energy live music showdown where the best student bands collide to turn up the volume and rock the crowd! Whether your style is hard-hitting rock, smooth pop, local fusion, or heavy metal, this event is your chance to showcase your tight chemistry, massive instrumentals, and killer stage presence. It is the ultimate platform to perform your original tracks or crowd-pleasing covers, command a roaring audience, and get noticed by experienced musicians. Plug in your amps, bring your loudest energy, and set the stage on fire!",
      prize: "Rs 25,000", 
      published: true, 
      order: 5, 
      format: "GROUP", 
      feeGroup: 399900, 
      minTeam: 8, 
      maxTeam: 8, 
      registrationOpen: true 
    },
    { 
      slug: "stock-sense", 
      title: "Stock Sense", 
      category: "Finance", 
      summary: "A solo simulation testing your market instincts.", 
      description: "Stock Sense is a pristine, high-stakes competition that challenges you to navigate the complexities of the stock market and sharpen your financial acumen. Designed for analytical minds, this event pushes you to use critical thinking and evaluate data trends to predict company performance and maximize investment returns. By monitoring live share values, leveraging secondary data, and simulating real-world portfolio management, you will decode market behavior and prove your ability to forecast the financial world's next big moves.",
      prize: "Rs 15,000", 
      published: true, 
      order: 6, 
      format: "SOLO", 
      feeSolo: 199900, 
      registrationOpen: true 
    },
    { 
      slug: "greenovation-showdown", 
      title: "Greenovation Showdown", 
      category: "Sustainability", 
      summary: "Team pitch battle for the best sustainability innovation.", 
      description: "The Greenovation Showdown is a sustainability challenge that invites you to develop innovative, research-driven solutions for pressing environmental issues. This competition offers the perfect platform to sharpen your creativity, collaboration, and practical problem-solving skills while working alongside a community of changemakers. By participating, you will actively contribute to a greener future and conduct impactful research dedicated to the overall well-being of society.",
      prize: "Rs 25,000", 
      published: true, 
      order: 7, 
      format: "BOTH", 
      feeSolo: 179900, 
      feeGroup: 399900, 
      minTeam: 2, 
      maxTeam: 5, 
      registrationOpen: true, 
      questionsText: "What is your pitch idea?" 
    },
    { 
      slug: "spark-tank", 
      title: "Spark Tank", 
      category: "Business", 
      summary: "Pitch your startup to a panel of investors, Shark-Tank style.", 
      description: "Spark Tank is an elite pitching competition that invites you to step into the business arena and present your revolutionary startup ideas to a panel of renowned entrepreneurs and investors. Designed for ambitious changemakers, this high-energy simulation challenges you to navigate the complexities of the business world, demonstrate your market potential, and prove the viability of your venture. It is the ultimate platform to refine your presentation skills, gain invaluable industry feedback, and network with mentors who can help turn your entrepreneurial vision into reality.",
      prize: "Rs 30,000", 
      published: true, 
      order: 8, 
      format: "BOTH", 
      feeSolo: 179900, 
      feeGroup: 399900, 
      minTeam: 2, 
      maxTeam: 5, 
      registrationOpen: true, 
      questionsText: "What is your pitch idea?" 
    },
    { 
      slug: "marketing-mayhem", 
      title: "Marketing Mayhem", 
      category: "Business", 
      summary: "Pitch a campaign — enter solo or as a team.", 
      description: "Marketing Mayhem challenges you to step into the shoes of a modern marketer, blending analytical insights with creative storytelling to tackle real-world business scenarios. In this high-energy competition, you and your team will brainstorm, build, and refine a compelling campaign that decodes consumer behavior and stands out in a crowded marketplace. Backed by industry mentorship, you will present your strategic vision to a panel of expert judges—competing for top honors, gaining invaluable feedback, and proving your ability to drive real business growth.",
      prize: "Rs 20,000", 
      published: true, 
      order: 9, 
      format: "BOTH", 
      feeSolo: 179900, 
      feeGroup: 399900, 
      minTeam: 2, 
      maxTeam: 5, 
      registrationOpen: true 
    },
    { 
      slug: "ipl-auction", 
      title: "IPL Auction", 
      category: "Strategy", 
      summary: "Build your dream XI in a fast-paced team auction.", 
      description: "IPL Auction House is an exciting cricket management challenge that immerses participants in the dynamic world of franchise auctions. Designed to enhance strategic thinking, decision-making, and resource allocation skills, the event brings together cricket enthusiasts to analyze player statistics, past performances, and team dynamics. Competing in teams of 3–4, participants are allotted a virtual budget of ₹100 crores and must strategically bid for players in a simulated auction to build a balanced squad of at least 10 players, all while staying within their franchise’s financial constraints.",
      prize: "Rs 20,000", 
      published: true, 
      order: 10, 
      format: "GROUP", 
      feeGroup: 439900, 
      minTeam: 2, 
      maxTeam: 5, 
      registrationOpen: true 
    },
    { 
      slug: "film-making", 
      title: "Nazarana: Film Making Competition", 
      category: "Creative", 
      summary: "A short-film challenge. Details and registration coming soon.", 
      description: "Nazarana is a cinematic battleground that challenges you to step behind the lens and translate raw imagination into powerful visual storytelling. Designed for visionary directors, scriptwriters, and editors, this competition pushes you to capture compelling narratives, master framing and sound design, and evoke deep emotional responses from the audience. It is the ultimate creative arena to showcase your technical filmmaking prowess, command the silver screen, and leave a lasting impression on a panel of acclaimed judges. Frame your vision, direct your masterpiece, and let your cinematic voice be heard!",
      prize: "Rs 30,000", 
      published: true, 
      order: 11, 
      format: "GROUP", 
      minTeam: 2, 
      maxTeam: 5, 
      feeGroup: 399900, 
      registrationOpen: true 
    },
  ];
  for (const c of competitions) {
    await prisma.competition.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  console.log("OK Seeded competitions (incl. solo/group cultural events)");

  const promos = [
    { code: "EARLYBIRD", kind: "PERCENT", value: 15, maxUses: 200, appliesTo: null as string | null, active: true },
    { code: "SCHOOL25", kind: "PERCENT", value: 25, maxUses: null as number | null, appliesTo: null as string | null, active: true },
    { code: "DELHI500", kind: "FLAT", value: 50000, maxUses: 100, appliesTo: null as string | null, active: true }
  ];
  for (const pc of promos) {
    await prisma.promoCode.upsert({ where: { code: pc.code }, update: pc, create: pc });
  }
  console.log(`OK Seeded ${promos.length} promo codes`);

  const schedule = [
    { day: 1, startTime: "09:00", endTime: "10:00", title: "Registration & Opening Ceremony", room: "Main Hall", order: 0, published: true },
    { day: 1, startTime: "10:15", endTime: "13:00", title: "Committee Session I", order: 1, published: true },
    { day: 1, startTime: "14:00", endTime: "17:00", title: "Committee Session II", order: 2, published: true },
    { day: 2, startTime: "09:30", endTime: "12:30", title: "Committee Session III", order: 3, published: true },
    { day: 2, startTime: "16:00", endTime: "17:30", title: "Closing & Awards", room: "Main Hall", order: 4, published: true }
  ];
  
  for (const s of schedule) {
  await prisma.scheduleItem.createMany({
    data: [s],
    skipDuplicates: true
  });
  }
  console.log("OK Seeded event flow");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
