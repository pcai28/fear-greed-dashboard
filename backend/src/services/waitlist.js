import { getWaitlistModel, waitlistConsentText } from "../models/waitlist.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const waitlistConsentVersion = "2026-07-02-global";

export function createWaitlistService({ mongo, getModel = getWaitlistModel }) {
  return {
    async signup(input = {}) {
      const email = String(input.email || "").trim().toLowerCase();
      if (!emailPattern.test(email) || email.length > 254) {
        const error = new Error("Please enter a valid email address.");
        error.status = 400;
        throw error;
      }
      if (input.consent !== true) {
        const error = new Error("Consent is required.");
        error.status = 400;
        throw error;
      }

      const connection = await mongo.getConnection();
      const WaitlistSignup = getModel(connection);
      const now = new Date();
      await WaitlistSignup.updateOne(
        { email },
        {
          $setOnInsert: {
            email,
            source: "footer_sms_alert_interest",
            createdAt: now
          },
          $set: {
            consentText: waitlistConsentText,
            consentVersion: waitlistConsentVersion,
            consentedAt: now,
            notifiedAt: null,
            deleteAt: null,
            updatedAt: now
          }
        },
        { upsert: true, timestamps: false }
      );

      return {
        ok: true,
        message: "Thanks — I’ll let you know when SMS alerts are available."
      };
    }
  };
}
