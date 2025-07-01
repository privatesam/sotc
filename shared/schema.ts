import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  gridColumns: integer("grid_columns").notNull().default(4),
  gridRows: integer("grid_rows").notNull().default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isCustom: boolean("is_custom").notNull().default(false),
});

export const watches = pgTable("watches", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  name: text("name").notNull(),
  brandId: integer("brand_id").notNull(),
  model: text("model"),
  purchaseDate: timestamp("purchase_date"),
  lastServiced: timestamp("last_serviced"),
  servicePeriod: integer("service_period").notNull().default(5), // years
  valuation: integer("valuation"), // in pence
  details: text("details"),
  images: jsonb("images").$type<string[]>().default([]),
  primaryImageIndex: integer("primary_image_index").default(0),
  gridPosition: integer("grid_position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
