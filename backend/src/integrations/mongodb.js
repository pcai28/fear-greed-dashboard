import mongoose from "mongoose";

export function createMongoConnection({ uri, dbName, disabled = false }) {
  let connectionPromise;

  return {
    async getConnection() {
      if (disabled || !uri) throw new Error("Waitlist database is not configured.");

      connectionPromise ??= mongoose
        .createConnection(uri, { dbName, serverSelectionTimeoutMS: 10_000 })
        .asPromise();
      return connectionPromise;
    },
    async close() {
      if (!connectionPromise) return;
      const connection = await connectionPromise;
      await connection.close();
      connectionPromise = undefined;
    }
  };
}
