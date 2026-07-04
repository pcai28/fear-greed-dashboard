import { afterEach, describe, expect, it, vi } from "vitest";
import { submitWaitlistEmail } from "../../src/api/waitlist.js";
import { createWaitlistForm } from "../../src/features/form/waitlist.js";

afterEach(() => vi.unstubAllGlobals());

describe("waitlist API", () => {
  it("sends only the email and explicit launch-notification consent", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true })
    });
    vi.stubGlobal("fetch", fetch);

    await submitWaitlistEmail("user@example.com", true, "test-token");

    expect(fetch).toHaveBeenCalledWith("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        consent: true,
        turnstileToken: "test-token"
      })
    });
  });
});

function formParts({ checked = false } = {}) {
  let submitHandler;
  const button = {
    disabled: true,
    textContent: "Email me at launch",
    setAttribute: vi.fn(),
    removeAttribute: vi.fn()
  };
  const form = {
    dataset: {},
    querySelector: vi.fn(() => button),
    addEventListener: vi.fn((event, handler) => {
      if (event === "submit") submitHandler = handler;
    }),
    reset: vi.fn()
  };
  const emailInput = {
    disabled: true,
    value: "user@example.com",
    addEventListener: vi.fn(),
    checkValidity: vi.fn(() => true),
    setAttribute: vi.fn(),
    focus: vi.fn()
  };
  const consentInput = {
    checked,
    disabled: true,
    addEventListener: vi.fn(),
    setAttribute: vi.fn(),
    focus: vi.fn()
  };
  const message = {
    textContent: "",
    className: "waitlist-message",
    classList: { contains: vi.fn(() => false) }
  };
  const challenge = {
    init: vi.fn().mockResolvedValue(undefined),
    getToken: vi.fn(() => "test-token"),
    reset: vi.fn(),
    focus: vi.fn()
  };
  return {
    button,
    emailInput,
    form,
    message,
    consentInput,
    challenge,
    submit: async () => submitHandler({ preventDefault: vi.fn() })
  };
}

describe("waitlist form", () => {
  it("remains disabled until the launch configuration is complete", () => {
    const parts = formParts();
    createWaitlistForm({ ...parts, submitEmail: vi.fn(), enabled: false }).init();
    expect(parts.emailInput.disabled).toBe(true);
    expect(parts.consentInput.disabled).toBe(true);
    expect(parts.button.disabled).toBe(true);
    expect(parts.message.textContent).toContain("privacy launch checklist");
  });

  it("does not submit without launch-notification consent", async () => {
    const parts = formParts({ checked: false });
    const submitEmail = vi.fn();
    await createWaitlistForm({ ...parts, submitEmail, enabled: true }).init();
    await parts.submit();
    expect(submitEmail).not.toHaveBeenCalled();
    expect(parts.consentInput.focus).toHaveBeenCalled();
    expect(parts.message.textContent).toContain("Agree to the one-time launch notification");
  });

  it("requires a current security token before submitting", async () => {
    const parts = formParts({ checked: true });
    parts.challenge.getToken.mockReturnValue("");
    const submitEmail = vi.fn();
    await createWaitlistForm({ ...parts, submitEmail, enabled: true }).init();
    await parts.submit();
    expect(submitEmail).not.toHaveBeenCalled();
    expect(parts.challenge.focus).toHaveBeenCalled();
    expect(parts.message.textContent).toContain("Complete the security check");
  });
});
