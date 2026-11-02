import { Pool } from "pg";
import { MongoClient } from "mongodb";
const state = globalThis as unknown as {
  pg?: Pool;
  mongo?: Promise<MongoClient>;
};
export function sql() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  return (state.pg ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  }));
}
export async function mongo() {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is not configured");
  state.mongo ??= new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .connect()
    .catch((e) => {
      state.mongo = undefined;
      throw e;
    });
  return (await state.mongo).db(process.env.MONGODB_DB || "pulsefit");
}
