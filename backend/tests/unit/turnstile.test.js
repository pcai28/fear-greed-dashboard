import { describe, expect, it, vi } from "vitest";
import { createTurnstileVerifier } from "../../src/services/turnstile.js";

const config = {
  secret: "1x0000000000000000000000000000000AA",
  expectedHostname: "market.example",
  expectedAction: "waitlist"
};
const alwaysFailSecret = "2x0000000000000000000000000000000AA";
const duplicateSecret = "3x0000000000000000000000000000000AA";

function response(body, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(body) };
}

describe("Turnstile verifier", () => {
  it("accepts a successful matching waitlist challenge", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response({ success: true, hostname: "market.example", action: "waitlist" })
    );
    const verifier = createTurnstileVerifier({ ...config, fetchImpl });
    await expect(verifier.verify("test-token")).resolves.toBe(true);
    const request = fetchImpl.mock.calls[0][1];
    expect(String(request.body)).toContain(`secret=${config.secret}`);
    expect(String(request.body)).toContain("response=test-token");
  });

  it.each([
    ["missing token", "", null, config.secret],
    [
      "failed token",
      "token",
      { success: false, "error-codes": ["invalid-input-response"] },
      alwaysFailSecret
    ],
    [
      "expired or reused token",
      "token",
      { success: false, "error-codes": ["timeout-or-duplicate"] },
      duplicateSecret
    ],
    [
      "wrong hostname",
      "token",
      { success: true, hostname: "evil.example", action: "waitlist" },
      config.secret
    ],
    [
      "wrong action",
      "token",
      { success: true, hostname: "market.example", action: "login" },
      config.secret
    ]
  ])("fails closed for %s", async (_name, token, result, secret) => {
    const fetchImpl = vi.fn().mockResolvedValue(response(result));
    const verifier = createTurnstileVerifier({ ...config, secret, fetchImpl });
    await expect(verifier.verify(token)).rejects.toMatchObject({ status: 400 });
    if (token) expect(String(fetchImpl.mock.calls[0][1].body)).toContain(`secret=${secret}`);
  });

  it("fails closed when the provider is unavailable", async () => {
    const verifier = createTurnstileVerifier({
      ...config,
      fetchImpl: vi.fn().mockRejectedValue(new Error("timeout"))
    });
    await expect(verifier.verify("token")).rejects.toMatchObject({ status: 503 });
  });
});
