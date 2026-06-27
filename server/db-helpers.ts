import { eq, and } from "drizzle-orm";
import { aiProviders, digitalCards, batchJobs, InsertAIProvider, InsertDigitalCard, InsertBatchJob } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * AI Provider Helpers
 */
export async function getAIProvidersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiProviders).where(eq(aiProviders.userId, userId));
}

export async function getActiveAIProvider(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.userId, userId),
        eq(aiProviders.provider, provider as any),
        eq(aiProviders.isActive, 1)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createAIProvider(data: InsertAIProvider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiProviders).values(data);
}

export async function updateAIProvider(id: number, data: Partial<InsertAIProvider>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiProviders).set(data).where(eq(aiProviders.id, id));
}

export async function deleteAIProvider(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiProviders).where(eq(aiProviders.id, id));
}

/**
 * Digital Card Helpers
 */
export async function getCardsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(digitalCards).where(eq(digitalCards.userId, userId));
}

export async function getCardById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(digitalCards).where(eq(digitalCards.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCard(data: InsertDigitalCard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(digitalCards).values(data);
  return result;
}

export async function updateCard(id: number, data: Partial<InsertDigitalCard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(digitalCards).set(data).where(eq(digitalCards.id, id));
}

export async function deleteCard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(digitalCards).where(eq(digitalCards.id, id));
}

/**
 * Batch Job Helpers
 */
export async function getBatchJobsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(batchJobs).where(eq(batchJobs.userId, userId));
}

export async function getBatchJobById(jobId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(batchJobs).where(eq(batchJobs.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBatchJob(data: InsertBatchJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(batchJobs).values(data);
}

export async function updateBatchJob(jobId: string, data: Partial<InsertBatchJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(batchJobs).set(data).where(eq(batchJobs.jobId, jobId));
}
