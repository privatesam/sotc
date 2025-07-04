import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  gridColumns: integer("grid_columns").notNull().default(4),
  gridRows: integer("grid_rows").notNull().default(3),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
});

export const watches = sqliteTable("watches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collectionId: integer("collection_id").notNull(),
  name: text("name").notNull(),
  brandId: integer("brand_id").notNull(),
  model: text("model"),
  purchaseDate: text("purchase_date"),
  lastServiced: text("last_serviced"),
  servicePeriod: integer("service_period").notNull().default(5), // years
  valuation: integer("valuation"), // in pence
  details: text("details"),
  history: text("history"),
  images: text("images", { mode: "json" }).$type<string[]>().default([]),
  primaryImageIndex: integer("primary_image_index").default(0),
  gridPosition: integer("grid_position"),
  wearDates: text("wear_dates", { mode: "json" }).$type<string[]>().default([]), // ISO date strings
  totalWearDays: integer("total_wear_days").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
});

export const insertWatchSchema = createInsertSchema(watches).omit({
  id: true,
  createdAt: true,
}).extend({
  purchaseDate: z.string().optional(),
  lastServiced: z.string().optional(),
});

export const updateWatchSchema = insertWatchSchema.partial().extend({
  id: z.number(),
});

export const updateCollectionSchema = insertCollectionSchema.partial().extend({
  id: z.number(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Watch = typeof watches.$inferSelect;
export type InsertWatch = z.infer<typeof insertWatchSchema>;
export type UpdateWatch = z.infer<typeof updateWatchSchema>;
