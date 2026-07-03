import { describe, expect, it, vi } from "vitest";
import { waitlistConsentText, waitlistSchema } from "../../src/models/waitlist.js";
import { createWaitlistService, waitlistConsentVersion } from "../../src/services/waitlist.js";

describe("waitlist", () => {
  it("defines the existing MongoDB collection and fields", () => {
    expect(waitlistSchema.get("collection")).toBe("waitlist_signups");
    expect(waitlistSchema.path("email").options.unique).toBe(true);
    expect(waitlistSchema.path("createdAt")).toBeDefined();
    expect(waitlistSchema.path("updatedAt")).toBeDefined();
    expect(waitlistSchema.path("consentVersion")).toBeDefined();
    expect(waitlistSchema.path("consentedAt")).toBeDefined();
    expect(waitlistSchema.path("usResidentAttestedAt")).toBeUndefined();
    expect(waitlistSchema.path("notifiedAt")).toBeDefined();
    expect(waitlistSchema.path("deleteAt")).toBeDefined();
    expect(waitlistSchema.indexes()).toContainEqual([
      { deleteAt: 1 },
      expect.objectContaining({ expireAfterSeconds: 0 })
    ]);
  });

  it("normalizes email and uses an idempotent upsert", async () => {
    const updateOne = vi.fn().mockResolvedValue({ acknowledged: true });
    const service = createWaitlistService({
      mongo: { getConnection: vi.fn().mockResolvedValue({}) },
      getModel: () => ({ updateOne })
    });
    await expect(
      service.signup({ email: "  USER@Example.COM ", consent: true })
    ).resolves.toMatchObject({ ok: true });
    expect(updateOne.mock.calls[0][0]).toEqual({ email: "user@example.com" });
    expect(updateOne.mock.calls[0][1].$set).toMatchObject({
      consentText: waitlistConsentText,
      consentVersion: waitlistConsentVersion,
      notifiedAt: null,
      deleteAt: null
    });
    expect(updateOne.mock.calls[0][1].$set.consentedAt).toBeInstanceOf(Date);
    expect(updateOne.mock.calls[0][2]).toMatchObject({ upsert: true });
  });

  it("rejects invalid email before connecting", async () => {
    const getConnection = vi.fn();
    const service = createWaitlistService({ mongo: { getConnection } });
    await expect(
      service.signup({ email: "not-an-email", consent: true })
    ).rejects.toMatchObject({ status: 400 });
    expect(getConnection).not.toHaveBeenCalled();
  });

  it("rejects a signup without explicit consent", async () => {
    const getConnection = vi.fn();
    const service = createWaitlistService({ mongo: { getConnection } });
    await expect(
      service.signup({ email: "user@example.com", consent: false })
    ).rejects.toMatchObject({ status: 400 });
    expect(getConnection).not.toHaveBeenCalled();
  });
});
