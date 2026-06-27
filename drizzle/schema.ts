import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/**
 * AI Provider Configuration table for BYOK integration
 */
export const aiProviders = mysqlTable("aiProviders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["groq", "openrouter", "cerebras"]).notNull(),
  apiKey: text("apiKey").notNull(),
  endpoint: varchar("endpoint", { length: 512 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIProvider = typeof aiProviders.$inferSelect;
export type InsertAIProvider = typeof aiProviders.$inferInsert;

/**
 * Saved Digital Cards
 */
export const digitalCards = mysqlTable("digitalCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  designation: varchar("designation", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  officeName: varchar("officeName", { length: 255 }),
  officeDetails: text("officeDetails"),
  headshotUrl: varchar("headshotUrl", { length: 512 }),
  socialLinks: text("socialLinks"),
  aspectRatio: mysqlEnum("aspectRatio", ["3:4", "16:9"]).default("3:4").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DigitalCard = typeof digitalCards.$inferSelect;
export type InsertDigitalCard = typeof digitalCards.$inferInsert;

/**
 * Batch Processing Jobs
 */
export const batchJobs = mysqlTable("batchJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobId: varchar("jobId", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  totalCandidates: int("totalCandidates").notNull(),
  processedCount: int("processedCount").default(0).notNull(),
  cardIds: text("cardIds"),
  downloadUrl: varchar("downloadUrl", { length: 512 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;
