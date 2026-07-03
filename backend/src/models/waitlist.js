import mongoose from "mongoose";

export const waitlistConsentText =
  "I agree to receive one launch notification. I can withdraw consent at any time. No newsletters. No spam.";

export const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254
    },
    source: { type: String, required: true },
    consentText: { type: String, required: true },
    consentVersion: { type: String, required: true },
    consentedAt: { type: Date, required: true },
    notifiedAt: { type: Date, default: null },
    deleteAt: { type: Date, default: null }
  },
  {
    collection: "waitlist_signups",
    timestamps: true,
    strict: true
  }
);

waitlistSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

export function getWaitlistModel(connection) {
  return (
    connection.models.WaitlistSignup ||
    connection.model("WaitlistSignup", waitlistSchema, "waitlist_signups")
  );
}
