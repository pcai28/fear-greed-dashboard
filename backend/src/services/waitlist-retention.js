const RETENTION_DAYS = 30;

export function retentionDeleteAt(now = new Date()) {
  return new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export async function scheduleWaitlistDeletion({ model, reason, now = new Date() }) {
  if (!new Set(["notified", "cancelled"]).has(reason)) {
    throw new Error("Reason must be notified or cancelled.");
  }

  const update = { deleteAt: retentionDeleteAt(now) };
  if (reason === "notified") update.notifiedAt = now;

  const result = await model.updateMany(
    { deleteAt: null },
    { $set: update },
    { timestamps: true }
  );
  return { matched: result.matchedCount || 0, modified: result.modifiedCount || 0 };
}
