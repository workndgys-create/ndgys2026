// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";
import { verifyCashfreeWebhook } from "@/lib/cashfree";

beforeAll(() => { process.env.CASHFREE_APP_ID = "test"; process.env.CASHFREE_SECRET_KEY = "secret"; });

describe("verifyCashfreeWebhook", () => {
  const body = JSON.stringify({ data: { order: { order_id: "ord_1" } } });
  const ts = "2026-08-22T10:00:00Z";
  const good = crypto.createHmac("sha256", "secret").update(ts + body).digest("base64");

  it("accepts a correctly signed payload", () => {
    expect(verifyCashfreeWebhook(body, ts, good)).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyCashfreeWebhook(body + "x", ts, good)).toBe(false);
  });
  it("rejects a bad signature", () => {
    expect(verifyCashfreeWebhook(body, ts, "not-a-signature")).toBe(false);
  });
});
