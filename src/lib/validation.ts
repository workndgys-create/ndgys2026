import { z } from "zod";

// Seed catalogue — mirrored into the DB `Track` table by prisma/seed.ts.
// At runtime, routes read fees/capacity from the DB so admin edits take effect.
export const TRACKS = [
  { slug: "global-policy", name: "Global Policy Dialogue", fee: 250000, capacity: 60, difficulty: "Intermediate",
    agenda: "Accountability for civilian protection under international humanitarian law and multilateral mechanisms." },
  { slug: "climate", name: "Climate & Sustainability Forum", fee: 250000, capacity: 50, difficulty: "Intermediate",
    agenda: "Financing a just energy transition — balancing growth, equity and the 1.5°C target." },
  { slug: "technology", name: "Technology & Society Lab", fee: 250000, capacity: 50, difficulty: "Intermediate",
    agenda: "Governing artificial intelligence: rights, safety and the digital public square." },
  { slug: "entrepreneurship", name: "Youth Entrepreneurship Track", fee: 300000, capacity: 40, difficulty: "Beginner",
    agenda: "Pitch, prototype and pressure-test ventures with founders and investors." },
  { slug: "human-rights", name: "Human Rights Council", fee: 250000, capacity: 50, difficulty: "Intermediate",
    agenda: "Protecting the rights of migrants in enforcement and border policy." },
  { slug: "press", name: "International Press Corps", fee: 200000, capacity: 30, difficulty: "Beginner",
    agenda: "Reporters, photographers and caricaturists documenting the Summit live." },
  { slug: "leadership", name: "Leadership & Diplomacy Summit", fee: 300000, capacity: 40, difficulty: "Advanced",
    agenda: "High-table diplomacy simulation on a live, evolving geopolitical crisis." },
  { slug: "crisis", name: "Continuous Crisis Committee", fee: 350000, capacity: 25, difficulty: "Advanced",
    agenda: "Classified. A continuous, fast-moving crisis that rewards quick thinking." }
] as const;

export const seedTrackBySlug = (slug: string) => TRACKS.find((t) => t.slug === slug);

export const GENDERS = ["male", "female", "other"] as const;
export const HEARD_OPTIONS = ["Instagram", "WhatsApp", "School / College", "Friend / Word of mouth", "Other"] as const;

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid phone number"),
  age: z.coerce.number().int().min(8).max(99).optional(),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  gender: z.enum(GENDERS).optional(),
  emergencyContact: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/, "Enter a valid contact number").optional().or(z.literal("")),
  institution: z.string().trim().min(2, "Enter your school / college").max(160),
  track: z.string().min(1, "Choose a track"),
  experience: z.enum(["beginner", "experienced"]).optional(),
  howHeard: z.string().trim().max(80).optional().or(z.literal("")),
  howHeardDetail: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  consentAccepted: z.coerce.boolean().optional(),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/).optional().or(z.literal("")),
  guardianConsent: z.coerce.boolean().optional(),
  customAnswers: z.array(z.object({ questionId: z.string(), label: z.string().max(300), value: z.union([z.string().max(2000), z.array(z.string().max(500))]) })).optional(),
  // honeypot — must be empty
  company: z.string().max(0).optional()
}).superRefine((v, ctx) => {
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
  age: z.coerce.number().int().min(5).max(99).optional()
});

export const competitionRegistrationSchema = z.object({
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
  institution: z.string().trim().min(2, "Enter your school / college").max(160),
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
  company: z.string().max(0).optional() // honeypot
}).superRefine((v, ctx) => {
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
});
export type CompetitionRegistrationInput = z.infer<typeof competitionRegistrationSchema>;

export const delegationMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the delegate's name").max(120),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().regex(/^[+]?[0-9\s-]{8,15}$/).optional().or(z.literal("")),
  track: z.string().min(1, "Choose a committee"),
  portfolioId: z.string().optional().or(z.literal(""))
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
