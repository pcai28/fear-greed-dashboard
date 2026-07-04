import { afterEach, describe, expect, it, vi } from "vitest";
import { createTurnstileChallenge } from "../../src/features/form/turnstile.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Turnstile challenge", () => {
  it("renders a Managed interaction-only waitlist challenge with the official test site key", async () => {
    const render = vi.fn(() => "widget-id");
    vi.stubGlobal("turnstile", { render, reset: vi.fn() });
    const onState = vi.fn();
    const challenge = createTurnstileChallenge({
      container: {},
      siteKey: "1x00000000000000000000AA",
      onState
    });

    await challenge.init();
    expect(render).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        sitekey: "1x00000000000000000000AA",
        action: "waitlist",
        theme: "auto",
        appearance: "interaction-only",
        "response-field": false,
        retry: "auto",
        "refresh-expired": "auto"
      })
    );
    render.mock.calls[0][1].callback("verified-token");
    expect(challenge.getToken()).toBe("verified-token");
    render.mock.calls[0][1]["expired-callback"]();
    expect(challenge.getToken()).toBe("");
    expect(onState).toHaveBeenCalledWith("expired");
  });
});
