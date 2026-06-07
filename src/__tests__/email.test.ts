import { describe, it, expect } from "vitest";
import { sendMail, templates } from "@/lib/email";

describe("email", () => {
  it("no-ops gracefully when RESEND_API_KEY is unset", async () => {
    const res = await sendMail({ to: "x@y.com", subject: "Hi", html: "<p>hi</p>" });
    expect(res.sent).toBe(false);
  });
  it("templates render the dynamic values", () => {
    const html = templates.registrationPaid("Aanya", "Climate Forum", "NDGYS-2026-AB12", 250000, "data:image/png;base64,AAA");
    expect(html).toContain("Aanya");
    expect(html).toContain("NDGYS-2026-AB12");
    expect(html).toContain("Climate Forum");
  });
});
