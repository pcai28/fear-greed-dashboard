import { describe, expect, it, vi } from "vitest";
import {
  retentionDeleteAt,
  scheduleWaitlistDeletion
} from "../../src/services/waitlist-retention.js";

describe("waitlist retention", () => {
  it("calculates deletion 30 days after the lifecycle event", () => {
    const now = new Date("2026-07-02T12:00:00.000Z");
    expect(retentionDeleteAt(now).toISOString()).toBe("2026-08-01T12:00:00.000Z");
  });

  it("marks notified records without exposing record contents", async () => {
    const updateMany = vi.fn().mockResolvedValue({ matchedCount: 4, modifiedCount: 4 });
    const now = new Date("2026-07-02T12:00:00.000Z");
    await expect(
      scheduleWaitlistDeletion({ model: { updateMany }, reason: "notified", now })
    ).resolves.toEqual({ matched: 4, modified: 4 });
    expect(updateMany).toHaveBeenCalledWith(
      { deleteAt: null },
      {
        $set: {
          notifiedAt: now,
          deleteAt: new Date("2026-08-01T12:00:00.000Z")
        }
      },
      { timestamps: true }
    );
  });

  it("schedules cancelled records without marking them notified", async () => {
    const updateMany = vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    await scheduleWaitlistDeletion({ model: { updateMany }, reason: "cancelled" });
    expect(updateMany.mock.calls[0][1].$set.notifiedAt).toBeUndefined();
  });
});
