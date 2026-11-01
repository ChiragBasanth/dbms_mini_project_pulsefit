import "dotenv/config";
import { MongoClient } from "mongodb";
import { setup } from "../database/mongo/setup";
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
const c = await new MongoClient(process.env.MONGODB_URI).connect();
try {
  await setup(c.db(process.env.MONGODB_DB || "pulsefit"));
  console.log("Workout validator and indexes installed");
} finally {
  await c.close();
}
