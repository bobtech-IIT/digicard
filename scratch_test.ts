import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb } from "./server/db";
import { digitalCards } from "./drizzle/schema";

async function run() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined (Masked)" : "Undefined");
  try {
    const db = await getDb();
    if (!db) {
      console.log("DB connection returned null");
      return;
    }
    console.log("DB connection succeeded. Attempting query...");
    const res = await db.select().from(digitalCards).limit(1);
    console.log("Query succeeded! Result:", res);
  } catch (err) {
    console.error("Error during test:", err);
  }
}

run();
