"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { feeForParticipation, validateTeam } from "@/lib/competitionRules";

declare global {
  interface Window { Cashfree?: any; }
}
function loadCashfree(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Cashfree) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Comp = { id: string; title: string; format: "SOLO" | "GROUP" | "BOTH"; minTeam: number | null; maxTeam: number | null; feeSolo: number | null; feeGroup: number | null; questions?: string[] };
type Member = { name: string; age: string; photoData?: string; photoMime?: string };

const HEARD = ["Instagram", "WhatsApp", "School / College", "Friend / Word of mouth", "Other"];

type CompetitionRegisterFormProps = { competition: Comp; slug?: string };

export default function CompetitionRegisterForm(props: CompetitionRegisterFormProps) {
  const { competition: c, slug } = props;
  const initialPart: "SOLO" | "GROUP" = c.format === "GROUP" ? "GROUP" : "SOLO";
  const [participation, setParticipation] = useState<"SOLO" | "GROUP">(initialPart);
  const min = c.minTeam ?? 2;
  const max = c.maxTeam ?? 5;
  const [members, setMembers] = useState<Member[]>(Array.from({ length: Math.min(2, max) }, () => ({ name: "", age: "", photoData: "", photoMime: "" })));
  const [status, setStatus] = useState<"idle" | "processing" | "paid" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const questions = c.questions ?? [];
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [heardFrom, setHeardFrom] = useState(HEARD[0]);
  const [heardDetail, setHeardDetail] = useState("");
  const [age, setAge] = useState("");
  const [consent, setConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const isMinor = age !== "" && Number(age) > 0 && Number(age) < 18;

  const [photoData, setPhotoData] = useState("");
  const [photoMime, setPhotoMime] = useState("");
  const [photoError, setPhotoError] = useState("");

  const fee = useMemo(() => feeForParticipation(c, participation) ?? 0, [c, participation]);

  const IPL_TEAMS_STATIC = [
    "Chennai Super Kings",
    "Deccan Chargers",
    "Delhi Capitals",
    "Royal Challengers Bangalore",
    "Gujarat Titans",
    "Kolkata Knight Riders",
    "Lucknow Super Giants",
    "Mumbai Indians",
    "Punjab Kings",
    "Rajasthan Royals",
    "Rising Pune Supergiant",
    "Royal Challengers Bengaluru",
    "Sunrisers Hyderabad"
  ];
  const [IPL_TEAMS, setIplTeams] = useState<string[]>(IPL_TEAMS_STATIC);

  const isIplAuction = slug === "ipl-auction";
  // Load teams dynamically from the API so admin can update them
  useEffect(() => {
    if (!isIplAuction) return;
    fetch('/api/ipl/teams').then((r) => r.json()).then((d) => {
      if (d && Array.isArray(d.teams) && d.teams.length > 0) setIplTeams(d.teams);
    }).catch(() => {});
  }, [isIplAuction]);
  const [teamChoice, setTeamChoice] = useState("");

  function addMember() { if (members.length < max) setMembers((m) => [...m, { name: "", age: "", photoData: "", photoMime: "" }]); }
  function removeMember(i: number) { if (members.length > 1) setMembers((m) => m.filter((_, idx) => idx !== i)); }
  function setMember(i: number, key: keyof Member, val: string) { setMembers((m) => m.map((mm, idx) => (idx === i ? { ...mm, [key]: val } : mm))); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("processing"); setMessage(""); setErrors({});
    const fd = new FormData(e.currentTarget);
    const cleanMembers = participation === "GROUP" ? members.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), age: m.age ? Number(m.age) : undefined, photoData: m.photoData, photoMime: m.photoMime })) : [];

    if (participation === "GROUP") {
      const v = validateTeam(c, "GROUP", cleanMembers.length);
      if (!v.ok) { setMessage(v.error); setStatus("error"); return; }
    }
    if (!consent) { setMessage("Please accept the Terms and Code of Conduct to continue."); setStatus("error"); return; }
    if (isMinor && !guardianConsent) { setMessage("Parent/guardian consent is required for participants under 18."); setStatus("error"); return; }

    if (isIplAuction && !teamChoice) { setMessage("Please choose an IPL team for the IPL Auction."); setStatus("error"); return; }

    if (!photoData || !photoMime) {
      setMessage("Please upload a passport size photo for the leader/participant.");
      setStatus("error");
      return;
    }
    if (participation === "GROUP") {
      const missingPhoto = cleanMembers.some((m) => !m.photoData || !m.photoMime);
      if (missingPhoto) {
        setMessage("Please upload a passport size photo for all team members.");
        setStatus("error");
        return;
      }
    }

    const payload: Record<string, unknown> = {
      competitionId: c.id,
      participation,
      teamName: fd.get("teamName") || "",
      leaderName: fd.get("leaderName") || "",
      email: fd.get("email") || "",
      phone: fd.get("phone") || "",
      age: fd.get("age") || undefined,
      city: fd.get("city") || "",
      gender: fd.get("gender") || undefined,
      emergencyContact: fd.get("emergencyContact") || "",
      institution: fd.get("institution") || "",
      pastExperience: fd.get("pastExperience") || "",
      howHeard: heardFrom,
      howHeardDetail: heardDetail,
      notes: fd.get("notes") || "",
      members: cleanMembers,
      answers: questions.map((q, i) => ({ q, a: (answers[i] || "").trim() })).filter((x) => x.a),
      consentAccepted: consent,
      guardianName: fd.get("guardianName") || "",
      guardianPhone: fd.get("guardianPhone") || "",
      guardianConsent,
      photoData,
      photoMime,
      teamChoice: isIplAuction ? teamChoice : undefined,
      company: fd.get("company") || ""
    };

    const res = await fetch("/api/competitions/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErrors(d.issues || {}); setMessage(d.error || "Please check the form."); setStatus("error"); return;
    }
    const order = await res.json();
    if (!(await loadCashfree())) { setMessage("Could not load the payment gateway."); setStatus("error"); return; }

    const cashfree = window.Cashfree({ mode: order.mode || "sandbox" });
    const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });
    if (result?.error) { setStatus("idle"); return; }

    const v = await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId }) });
    if (v.ok) setStatus("paid");
    else if (v.status === 202) { setMessage("Payment is processing — your confirmation email will arrive shortly if it succeeded."); setStatus("error"); }
    else { setMessage("Payment could not be verified. If charged, contact us."); setStatus("error"); }
  }

  if (status === "paid") {
    return (
      <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-8 text-center">
        <p className="font-display text-5xl">&#127881;</p>
        <h2 className="mt-3 font-display text-3xl font-700 text-ink">You're registered!</h2>
        <p className="mt-2 text-ink/70">A confirmation email with your entry reference is on its way.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-midnight px-6 py-3 font-600 text-cream hover:bg-royal">Back home</Link>
      </div>
    );
  }

  const isTeam = participation === "GROUP";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-ink/10 bg-paper p-7 shadow-sm">
      {c.format === "BOTH" && (
        <div>
          <label className="text-sm font-500 text-ink/80">Participation</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["SOLO", "GROUP"] as const).map((p) => (
              <button type="button" key={p} onClick={() => setParticipation(p)}
                className={`rounded-lg px-3 py-2.5 text-sm font-600 transition ${participation === p ? "bg-midnight text-cream ring-2 ring-gold" : "bg-cream text-ink hover:ring-1 hover:ring-gold"}`}>
                {p === "SOLO" ? "Solo" : "Group / Team"}
              </button>
            ))}
          </div>
        </div>
      )}

      {isTeam && <Field name="teamName" label="Team name" errors={errors} />}

      <Field name="leaderName" label={isTeam ? "Team leader name" : "Full name"} errors={errors} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field name="email" type="email" label={isTeam ? "Leader email" : "Email"} errors={errors} />
        <Field name="phone" label={isTeam ? "Leader number" : "Phone number"} errors={errors} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-500 text-ink/80">Age</label>
          <input name="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
          {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age[0]}</p>}
        </div>
        <div>
          <label className="text-sm font-500 text-ink/80">Gender</label>
          <select name="gender" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
      </div>
      {isIplAuction && (
        <div>
          <label className="text-sm font-500 text-ink/80">Choose your IPL team</label>
          <select value={teamChoice} onChange={(e) => setTeamChoice(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold">
            <option value="">-- Select team --</option>
            {IPL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field name="city" label="Place / City" errors={errors} />
        <Field name="emergencyContact" label="Emergency contact" errors={errors} />
      </div>
      <Field name="institution" label="School / College" errors={errors} required />

      <div>
        <label className="text-sm font-500 text-ink/80 block">
          Passport Size Photo (JPEG/PNG, Max 2MB) <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/jpeg, image/png"
          required
          onChange={(e) => {
            setPhotoError("");
            const file = e.target.files?.[0];
            if (!file) {
              setPhotoData("");
              setPhotoMime("");
              return;
            }
            if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/jpg") {
              setPhotoError("Only JPEG and PNG formats are supported.");
              setPhotoData("");
              setPhotoMime("");
              return;
            }
            if (file.size > 2 * 1024 * 1024) {
              setPhotoError("Photo must be smaller than 2MB.");
              setPhotoData("");
              setPhotoMime("");
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              setPhotoData(base64);
              setPhotoMime(file.type);
            };
            reader.readAsDataURL(file);
          }}
          className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-midnight hover:file:bg-goldlite"
        />
        {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
      </div>

      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {isTeam && (
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-500 text-ink/80">Team members ({min}-{max})</label>
            <button type="button" onClick={addMember} disabled={members.length >= max} className="text-sm font-600 text-gold hover:underline disabled:opacity-40">+ Add member</button>
          </div>
          <p className="mt-0.5 text-xs text-slatey">Maximum {max} members per team.</p>
          <div className="mt-2 space-y-4">
            {members.map((m, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-ink/10 bg-cream/40 p-4">
                <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                  <span className="text-xs font-600 text-slatey">Team Member {i + 1}</span>
                  <button type="button" onClick={() => removeMember(i)} disabled={members.length <= 1} className="text-xs font-600 text-red-600 hover:underline disabled:opacity-30">Remove</button>
                </div>
                <div className="flex gap-2">
                  <input value={m.name} onChange={(e) => setMember(i, "name", e.target.value)} placeholder={`Member ${i + 1} name`} required className="flex-1 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                  <input value={m.age} onChange={(e) => setMember(i, "age", e.target.value)} placeholder="Age" inputMode="numeric" required className="w-20 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="text-[11px] font-500 text-ink/75 block mb-1">Passport Photo (JPEG/PNG, Max 2MB) *</label>
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setMember(i, "photoData", "");
                        setMember(i, "photoMime", "");
                        return;
                      }
                      if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/jpg") {
                        alert("Only JPEG and PNG formats are supported.");
                        e.target.value = "";
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Photo must be smaller than 2MB.");
                        e.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64 = (reader.result as string).split(",")[1];
                        setMember(i, "photoData", base64);
                        setMember(i, "photoMime", file.type);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-1.5 text-xs outline-none focus:border-gold file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-gold file:text-midnight hover:file:bg-goldlite"
                  />
                </div>
              </div>
            ))}
          </div>
          {errors.members && <p className="mt-1 text-xs text-red-600">{errors.members[0]}</p>}

          <div className="mt-3">
            <label className="text-sm font-500 text-ink/80">Past experience (optional)</label>
            <textarea name="pastExperience" rows={2} placeholder="A short note on relevant past performances / wins" className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold" />
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-3 rounded-xl border border-gold/30 bg-goldlite/10 p-4">
          {questions.map((q, i) => (
            <div key={i}>
              <label className="text-sm font-600 text-ink">{q}</label>
              <textarea value={answers[i] || ""} onChange={(e) => setAnswers((a) => a.map((v, idx) => (idx === i ? e.target.value : v)))} rows={2} className="mt-1 w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-gold" />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-sm font-500 text-ink/80">How did you hear about us?</label>
        <select
          name="howHeard"
          value={heardFrom}
          onChange={(e) => {
            const next = e.target.value;
            setHeardFrom(next);
            if (next !== "Friend / Word of mouth" && next !== "Other") setHeardDetail("");
          }}
          className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold"
        >
          {HEARD.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        {(heardFrom === "Friend / Word of mouth" || heardFrom === "Other") && (
          <textarea
            name="howHeardDetail"
            value={heardDetail}
            onChange={(e) => setHeardDetail(e.target.value)}
            rows={2}
            required
            placeholder="Please tell us a little more"
            className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        )}
        {errors.howHeardDetail && <p className="mt-1 text-xs text-red-600">{errors.howHeardDetail[0]}</p>}
      </div>
      <div>
        <label className="text-sm font-500 text-ink/80">Anything you'd like us to know? (optional)</label>
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-gold" />
      </div>

      {isMinor && (
        <div className="space-y-3 rounded-xl border border-[#D97706]/40 bg-[#D97706]/10 p-4">
          <p className="text-sm font-600 text-amber-900">You're under 18 — a parent/guardian must consent.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field name="guardianName" label="Parent / guardian name" errors={errors} />
            <Field name="guardianPhone" label="Guardian contact number" errors={errors} />
          </div>
          <label className="flex items-start gap-2 text-sm text-amber-900">
            <input type="checkbox" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} className="mt-0.5 accent-gold" />
            <span>I am the parent/guardian and I consent to this participant taking part.</span>
          </label>
          {errors.guardianConsent && <p className="text-xs text-red-600">{errors.guardianConsent[0]}</p>}
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-gold" />
        <span>I have read and agree to the <a href="/terms" target="_blank" className="font-600 text-gold hover:underline">Terms</a> and the <a href="/code-of-conduct" target="_blank" className="font-600 text-gold hover:underline">Code of Conduct</a>.</span>
      </label>

      <div className="flex items-center justify-between rounded-lg bg-cream px-4 py-3">
        <span className="text-sm text-ink/70">Amount payable {isTeam ? "(per team)" : ""}</span>
        <span className="font-display text-2xl font-700 text-ink">Rs {fee.toLocaleString("en-IN")}</span>
      </div>

      <button disabled={status === "processing" || !consent || (isMinor && !guardianConsent)} className="w-full rounded-full bg-gold py-3 font-600 text-midnight transition hover:bg-goldlite disabled:opacity-60">
        {status === "processing" ? "Processing..." : "Pay & register"}
      </button>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <p className="text-center text-xs text-slatey">Secured by Cashfree</p>
    </form>
  );
}

function Field({ name, label, type = "text", errors, required = false }: { name: string; label: string; type?: string; errors: Record<string, string[]>; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-500 text-ink/80">{label}</label>
      <input name={name} type={type} required={required} className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 outline-none focus:border-gold" />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}
    </div>
  );
}
