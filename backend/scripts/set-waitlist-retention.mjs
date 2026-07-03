import { assertWaitlistLaunchReady, env } from "../src/config/env.js";
import { createMongoConnection } from "../src/integrations/mongodb.js";
import { getWaitlistModel } from "../src/models/waitlist.js";
import { scheduleWaitlistDeletion } from "../src/services/waitlist-retention.js";

const reason = process.argv[2];
if (!new Set(["notified", "cancelled"]).has(reason)) {
  console.error("Usage: npm run waitlist:retention -w backend -- notified|cancelled");
  process.exitCode = 1;
} else {
  assertWaitlistLaunchReady({ ...env, waitlistEnabled: true });
  const mongo = createMongoConnection({ uri: env.mongoUri, dbName: env.mongoDbName });
  try {
    const connection = await mongo.getConnection();
    const result = await scheduleWaitlistDeletion({
      model: getWaitlistModel(connection),
      reason
    });
    console.log(`Retention scheduled: ${result.modified} record(s); reason=${reason}.`);
  } finally {
    await mongo.close();
  }
}
