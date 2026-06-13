import { z } from "zod";

// Seed catalogue — mirrored into the DB `Track` table by prisma/seed.ts.
// At runtime, routes read fees/capacity from the DB so admin edits take effect.
export const TRACKS = [
  { 
    slug: "unsc", 
    name: "United Nations Security Council", 
    fee: 2500, 
    capacity: 15, 
    difficulty: "Advanced", 
    agenda: "Security and peacekeeping issues.",
    description: "The United Nations Security Council is the premier international body charged with maintaining global peace and security. Delegates will engage in intense deliberations, crisis management, and diplomatic negotiations to address pressing threats to peace, resolve conflicts, and draft resolutions that shape the future of international relations."
  },
  { 
    slug: "unga", 
    name: "United Nations General Assembly", 
    fee: 2000, 
    capacity: 60, 
    difficulty: "Intermediate", 
    agenda: "General multilateral discussions and global policy.",
    description: "The United Nations General Assembly serves as the main deliberative, policymaking, and representative organ of the UN. In this committee, delegates will represent their nations in multilateral discussions, addressing a wide array of global challenges including development, disarmament, international law, and human rights to reach consensus-driven solutions."
  },
  { 
    slug: "unhrc", 
    name: "United Nations Human Rights Council", 
    fee: 2000, 
    capacity: 50, 
    difficulty: "Intermediate", 
    agenda: "Human rights protections and policy.",
    description: "The United Nations Human Rights Council is dedicated to promoting and protecting human rights around the globe. Delegates will debate critical issues concerning human rights violations, structural inequalities, and policy frameworks to ensure dignity, freedom, and justice for all individuals worldwide."
  },
  { 
    slug: "csw", 
    name: "United Nations Commission on the Status of Women", 
    fee: 2000, 
    capacity: 40, 
    difficulty: "Intermediate", 
    agenda: "Gender equality and women's rights.",
    description: "The Commission on the Status of Women is the principal global intergovernmental body exclusively dedicated to the promotion of gender equality and the empowerment of women. Delegates will analyze progress, identify challenges, and formulate policies to advance women's political, economic, and social rights globally."
  },
  { 
    slug: "unicef", 
    name: "United Nations International Children's Emergency Fund", 
    fee: 2000, 
    capacity: 40, 
    difficulty: "Intermediate", 
    agenda: "Child welfare and emergency response.",
    description: "UNICEF is dedicated to safeguarding the rights and well-being of children worldwide. In this committee, delegates will address issues ranging from child healthcare and education to emergency humanitarian assistance in conflict zones, working to ensure a brighter and safer future for every child."
  },
  { 
    slug: "unep", 
    name: "United Nations Environment Programme", 
    fee: 2000, 
    capacity: 50, 
    difficulty: "Intermediate", 
    agenda: "Environmental policy and sustainability.",
    description: "The United Nations Environment Programme is the leading global environmental authority. Delegates will tackle critical ecological challenges, including climate change, biodiversity loss, and pollution, developing sustainable policy frameworks that promote green development and protect our planet's ecosystems."
  },
  { 
    slug: "wto", 
    name: "World Trade Organization", 
    fee: 2500, 
    capacity: 50, 
    difficulty: "Intermediate", 
    agenda: "Global trade rules and disputes.",
    description: "The World Trade Organization is the only global international organization dealing with the rules of trade between nations. Delegates will simulate trade negotiations, resolve complex commercial disputes, and draft agreements aimed at fostering open, fair, and sustainable international trade."
  },
  { 
    slug: "international-press", 
    name: "International Press", 
    fee: 2000, 
    capacity: 130, 
    difficulty: "Intermediate", 
    agenda: "Real-time summit journalism through reporting, caricature and photography.",
    description: "The International Press offers a unique, hands-on experience in journalism and media. Participants will act as reporters, caricature artists, and photographers, documenting committee sessions in real time, interviewing delegates, and publishing newsletters that capture the dynamic spirit of the summit."
  },
  { 
    slug: "aippm", 
    name: "All India Political Parties Meet", 
    fee: 1500, 
    capacity: 60, 
    difficulty: "Beginner", 
    agenda: "National multiparty dialogue and consensus building.",
    description: "The All India Political Parties Meet is a simulation of national political dialogue, bringing together diverse political ideologies. Delegates will represent prominent Indian leaders and discuss crucial socio-economic and political challenges facing the nation, seeking to build national consensus through debate and negotiation."
  },
  { 
    slug: "lok-sabha", 
    name: "Lok Sabha", 
    fee: 1500, 
    capacity: 60, 
    difficulty: "Beginner", 
    agenda: "Parliamentary debate and lawmaking.",
    description: "The Lok Sabha is the lower house of India's Parliament, where legislation is debated and passed. Representatives will engage in parliamentary debates, raise questions on national policy, and draft bills, simulating the democratic process of lawmaking in India."
  },
  { 
    slug: "war-cabinet", 
    name: "Indian War Cabinet", 
    fee: 1500, 
    capacity: 30, 
    difficulty: "Advanced", 
    agenda: "Crisis governance and strategic decision-making.",
    description: "The Indian War Cabinet is an elite, fast-paced crisis simulation focused on high-stakes national security and strategic decision-making. Members will navigate complex geopolitical crises, coordinate defense strategies, and make critical decisions under extreme time pressure to safeguard national interests."
  }
] as const;

export const seedTrackBySlug = (slug: string) => TRACKS.find((t) => t.slug === slug);
export const BEGINNER_TRACK_SLUGS = new Set<string>(["unep", "aippm"]);
export const isBeginnerTrackSlug = (slug: string) => BEGINNER_TRACK_SLUGS.has(slug);

export const GENDERS = ["male", "female", "other"] as const;
export const HEARD_OPTIONS = ["Instagram", "WhatsApp", "School / College", "Friend / Word of mouth", "Other"] as const;

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number"),
  age: z.coerce.number().int().min(10).max(30),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  gender: z.enum(GENDERS).optional(),
  emergencyContact: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid contact number").optional().or(z.literal("")),
    institution: z.string().trim().min(2, "Enter your school / college").max(160).optional().or(z.literal("")),
  track: z.string().min(1, "Choose a track"),
  howHeard: z.string().trim().max(80).optional().or(z.literal("")),
  howHeardDetail: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  consentAccepted: z.coerce.boolean().optional(),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/).optional().or(z.literal("")),
  guardianConsent: z.coerce.boolean().optional(),
  customAnswers: z.array(z.object({ questionId: z.string(), label: z.string().max(300), value: z.union([z.string().max(2000), z.array(z.string().max(500))]) })).optional(),
  photoData: z.string().optional(),
  photoMime: z.string().optional(),
  delegate2: z.object({
    fullName: z.string().trim().min(2, "Please enter delegate 2's full name").max(120),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number").optional().or(z.literal("")),
    institution: z.string().trim().min(2, "Enter your school / college").max(160).optional().or(z.literal("")),
    age: z.coerce.number().int().min(8).max(99).optional(),
    gender: z.enum(GENDERS).optional(),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    emergencyContact: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid contact number").optional().or(z.literal("")),
    photoData: z.string().optional(),
    photoMime: z.string().optional()
  }).optional(),
  // honeypot — must be empty
  company: z.string().max(0).optional()
}).superRefine((v, ctx) => {
  if (isBeginnerTrackSlug(v.track)) {
    if (typeof v.age !== "number") {
      ctx.addIssue({ code: "custom", path: ["age"], message: "Age is required for beginner committees (12-16 only)." });
    } else if (v.age < 12 || v.age > 16) {
      ctx.addIssue({ code: "custom", path: ["age"], message: "Beginner committees are only open to delegates aged 12-16." });
    }
  }

  if (typeof v.age === "number" && v.age < 18) {
    if (!v.guardianName || !v.guardianName.trim()) ctx.addIssue({ code: "custom", path: ["guardianName"], message: "Parent/guardian name is required for delegates under 18" });
    if (!v.guardianPhone || !v.guardianPhone.trim()) ctx.addIssue({ code: "custom", path: ["guardianPhone"], message: "Parent/guardian contact is required for delegates under 18" });
    if (!v.guardianConsent) ctx.addIssue({ code: "custom", path: ["guardianConsent"], message: "Parent/guardian consent is required for delegates under 18" });
  }
  if ((v.howHeard === "Friend / Word of mouth" || v.howHeard === "Other") && !v.howHeardDetail?.trim()) {
    ctx.addIssue({ code: "custom", path: ["howHeardDetail"], message: "Please add a short description" });
  }
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number").optional().or(z.literal("")),
  subject: z.enum(["General Enquiry", "Track Question", "Registration Help", "Press / Media", "Other"]),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  company: z.string().max(0).optional() // honeypot
});
export type ContactInput = z.infer<typeof contactSchema>;

export const waitlistSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  track: z.string().min(1)
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/),
  institution: z.string().trim().max(160).optional().or(z.literal("")),
  dietary: z.string().trim().max(200).optional().or(z.literal("")),
  accessibility: z.string().trim().max(200).optional().or(z.literal(""))
});

export const competitionMemberSchema = z.object({
  name: z.string().trim().min(2, "Member name is too short").max(120),
  age: z.coerce.number().int().min(10).max(30),
  photoData: z.string().optional(),
  photoMime: z.string().optional()
});

const competitionRegistrationBase = z.object({
  competitionId: z.string().min(1, "Choose a competition"),
  participation: z.enum(["SOLO", "GROUP"]),
  teamName: z.string().trim().max(120).optional().or(z.literal("")),
  leaderName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number"),
  age: z.coerce.number().int().min(8).max(99).optional(),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  gender: z.enum(GENDERS).optional(),
  emergencyContact: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid contact number").optional().or(z.literal("")),
    institution: z.string().trim().min(2, "Enter your school / college").max(160).optional().or(z.literal("")),
  pastExperience: z.string().trim().max(1000).optional().or(z.literal("")),
  howHeard: z.string().trim().max(80).optional().or(z.literal("")),
  howHeardDetail: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  members: z.array(competitionMemberSchema).default([]),
  answers: z.array(z.object({ q: z.string().max(300), a: z.string().trim().max(1000) })).optional(),
  consentAccepted: z.coerce.boolean().optional(),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/).optional().or(z.literal("")),
  guardianConsent: z.coerce.boolean().optional(),
  photoData: z.string().optional(),
  photoMime: z.string().optional(),
  company: z.string().max(0).optional() // honeypot
});

function refineCompetitionRegistration(v: z.infer<typeof competitionRegistrationBase>, ctx: z.RefinementCtx) {
  if (v.participation === "GROUP") {
    if (!v.teamName || !v.teamName.trim()) ctx.addIssue({ code: "custom", path: ["teamName"], message: "Team name is required for group entries" });
    if (v.members.length === 0) ctx.addIssue({ code: "custom", path: ["members"], message: "Add at least one team member" });
  }
  if (typeof v.age === "number" && v.age < 18) {
    if (!v.guardianName || !v.guardianName.trim()) ctx.addIssue({ code: "custom", path: ["guardianName"], message: "Parent/guardian name is required for participants under 18" });
    if (!v.guardianPhone || !v.guardianPhone.trim()) ctx.addIssue({ code: "custom", path: ["guardianPhone"], message: "Parent/guardian contact is required for participants under 18" });
    if (!v.guardianConsent) ctx.addIssue({ code: "custom", path: ["guardianConsent"], message: "Parent/guardian consent is required for participants under 18" });
  }
  if ((v.howHeard === "Friend / Word of mouth" || v.howHeard === "Other") && !v.howHeardDetail?.trim()) {
    ctx.addIssue({ code: "custom", path: ["howHeardDetail"], message: "Please add a short description" });
  }
}

export const competitionRegistrationSchema = competitionRegistrationBase.superRefine(refineCompetitionRegistration);
export type CompetitionRegistrationInput = z.infer<typeof competitionRegistrationSchema>;

// allow optional teamChoice for competitions (e.g., IPL Auction)
export const competitionRegistrationSchemaWithTeam = competitionRegistrationBase.extend({ teamChoice: z.string().optional().or(z.literal("") ) }).superRefine(refineCompetitionRegistration);

export const delegationMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the delegate's name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/).optional().or(z.literal("")),
  track: z.string().min(1, "Choose a committee"),
  portfolioId: z.string().optional().or(z.literal("")),
  age: z.coerce.number().int().min(8).max(99),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/).optional().or(z.literal("")),
  guardianConsent: z.coerce.boolean().optional(),
  photoData: z.string().optional(),
  photoMime: z.string().optional()
});
export const delegationSchema = z.object({
  schoolName: z.string().trim().min(2, "Enter the school / institution").max(160),
  headName: z.string().trim().min(2, "Enter the lead contact name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number"),
  institution: z.string().trim().max(160).optional().or(z.literal("")),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
  members: z.array(delegationMemberSchema).min(1, "Add at least one delegate").max(40),
  consentAccepted: z.coerce.boolean().optional(),
  company: z.string().max(0).optional() // honeypot
});
export type DelegationInput = z.infer<typeof delegationSchema>;

// Additional delegation-level refinements (age restrictions per committee)
const AGE_18_TRACK_SLUGS = new Set<string>(["unsc"]);

function refineDelegation(v: z.infer<typeof delegationSchema>, ctx: z.RefinementCtx) {
  for (let i = 0; i < v.members.length; i++) {
    const m = v.members[i];
    if (AGE_18_TRACK_SLUGS.has(m.track)) {
      if (typeof m.age !== "number" || m.age < 18) {
        ctx.addIssue({ code: "custom", path: ["members", String(i), "age"], message: `Members in this committee must be 18 or older` });
      }
    }
    // Enforce beginner age range for beginner-designated committees
    if (BEGINNER_TRACK_SLUGS.has(m.track)) {
      if (typeof m.age !== "number") {
        ctx.addIssue({ code: "custom", path: ["members", String(i), "age"], message: "Age is required for beginner committees (12-16 only)." });
      } else if (m.age < 12 || m.age > 16) {
        ctx.addIssue({ code: "custom", path: ["members", String(i), "age"], message: "Beginner committees are only open to delegates aged 12-16." });
      }
    }
    // If delegate is under 18, guardian info is required
    if (typeof m.age === "number" && m.age < 18) {
      if (!m.guardianName || !m.guardianName.trim()) ctx.addIssue({ code: "custom", path: ["members", String(i), "guardianName"], message: "Parent/guardian name is required for delegates under 18" });
      if (!m.guardianPhone || !m.guardianPhone.trim()) ctx.addIssue({ code: "custom", path: ["members", String(i), "guardianPhone"], message: "Parent/guardian contact is required for delegates under 18" });
      if (!m.guardianConsent) ctx.addIssue({ code: "custom", path: ["members", String(i), "guardianConsent"], message: "Parent/guardian consent is required for delegates under 18" });
    }
  }
}

export const delegationSchemaWithRefine = delegationSchema.superRefine(refineDelegation);
export type DelegationInputWithRefine = z.infer<typeof delegationSchemaWithRefine>;
