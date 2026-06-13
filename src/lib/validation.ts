import { z } from "zod";

// Seed catalogue — mirrored into the DB `Track` table by prisma/seed.ts.
// At runtime, routes read fees/capacity from the DB so admin edits take effect.
export const TRACKS = [
  { slug: "unsc", name: "United Nations Security Council", fee: 2500, capacity: 15, difficulty: "Advanced", agenda: "Security and peacekeeping issues." },
  { slug: "unga", name: "United Nations General Assembly", fee: 2000, capacity: 60, difficulty: "Intermediate", agenda: "General multilateral discussions and global policy." },
  { slug: "unhrc", name: "United Nations Human Rights Council", fee: 2000, capacity: 50, difficulty: "Intermediate", agenda: "Human rights protections and policy." },
  { slug: "csw", name: "United Nations Commission on the Status of Women", fee: 2000, capacity: 40, difficulty: "Intermediate", agenda: "Gender equality and women's rights." },
  { slug: "unicef", name: "United Nations International Children's Emergency Fund", fee: 2000, capacity: 40, difficulty: "Intermediate", agenda: "Child welfare and emergency response." },
  { slug: "unep", name: "United Nations Environment Programme", fee: 2000, capacity: 50, difficulty: "Intermediate", agenda: "Environmental policy and sustainability." },
  { slug: "wto", name: "World Trade Organization", fee: 2500, capacity: 50, difficulty: "Intermediate", agenda: "Global trade rules and disputes." },
  { slug: "international-press", name: "International Press", fee: 2000, capacity: 130, difficulty: "Intermediate", agenda: "Real-time summit journalism through reporting, caricature and photography." },
  { slug: "aippm", name: "All India Political Parties Meet", fee: 1500, capacity: 60, difficulty: "Beginner", agenda: "National multiparty dialogue and consensus building." },
  { slug: "lok-sabha", name: "Lok Sabha", fee: 1500, capacity: 60, difficulty: "Beginner", agenda: "Parliamentary debate and lawmaking." },
  { slug: "war-cabinet", name: "Indian War Cabinet", fee: 1500, capacity: 30, difficulty: "Advanced", agenda: "Crisis governance and strategic decision-making." }
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
