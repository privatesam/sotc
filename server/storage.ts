import { 
  collections, 
  brands, 
  watches, 
  type Collection, 
  type InsertCollection, 
  type UpdateCollection,
  type Brand, 
  type InsertBrand,
  type Watch, 
  type InsertWatch,
  type UpdateWatch
} from "@shared/schema";

export interface IStorage {
  // Collections
  getCollections(): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(collection: UpdateCollection): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;

  // Brands
  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  getBrandByName(name: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;

  // Watches
  getWatches(collectionId?: number): Promise<Watch[]>;
  getWatch(id: number): Promise<Watch | undefined>;
  createWatch(watch: InsertWatch): Promise<Watch>;
  updateWatch(watch: UpdateWatch): Promise<Watch | undefined>;
  deleteWatch(id: number): Promise<boolean>;
  
  // Wear tracking
  addWearDate(watchId: number, date: string): Promise<Watch | undefined>;
  removeWearDate(watchId: number, date: string): Promise<Watch | undefined>;
  
  // Batch operations
  updateWatchPositions(positions: { id: number; gridPosition: number }[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private collections: Map<number, Collection>;
  private brands: Map<number, Brand>;
  private watches: Map<number, Watch>;
  private currentCollectionId: number;
  private currentBrandId: number;
  private currentWatchId: number;

  constructor() {
    this.collections = new Map();
    this.brands = new Map();
    this.watches = new Map();
    this.currentCollectionId = 1;
    this.currentBrandId = 1;
    this.currentWatchId = 1;

    // Initialize with default data
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Create default collection
    const defaultCollection: Collection = {
      id: this.currentCollectionId++,
      name: "SOTC",
      description: "State of the Collection",
      gridColumns: 4,
      gridRows: 3,
      createdAt: new Date(),
    };
    this.collections.set(defaultCollection.id, defaultCollection);

    // Create default brands
    const defaultBrands = [
      { name: "Rolex", isCustom: false },
      { name: "Omega", isCustom: false },
      { name: "Tudor", isCustom: false },
      { name: "Seiko", isCustom: false },
      { name: "Casio", isCustom: false },
      { name: "Breitling", isCustom: false },
      { name: "TAG Heuer", isCustom: false },
    ];

    defaultBrands.forEach(brand => {
      const newBrand: Brand = {
        id: this.currentBrandId++,
        name: brand.name,
        isCustom: brand.isCustom,
      };
      this.brands.set(newBrand.id, newBrand);
    });
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const collection: Collection = {
      id: this.currentCollectionId++,
      name: insertCollection.name,
      description: insertCollection.description || null,
      gridColumns: insertCollection.gridColumns || 4,
      gridRows: insertCollection.gridRows || 3,
      createdAt: new Date(),
    };
    this.collections.set(collection.id, collection);
    return collection;
  }

  async updateCollection(updateCollection: UpdateCollection): Promise<Collection | undefined> {
    const existing = this.collections.get(updateCollection.id);
    if (!existing) return undefined;

    const updated: Collection = {
      ...existing,
      ...updateCollection,
    };
    this.collections.set(updated.id, updated);
    return updated;
  }

  async deleteCollection(id: number): Promise<boolean> {
    const deleted = this.collections.delete(id);
    if (deleted) {
      // Also delete all watches in this collection
      const watchesToDelete = Array.from(this.watches.values())
        .filter(watch => watch.collectionId === id);
      watchesToDelete.forEach(watch => this.watches.delete(watch.id));
    }
    return deleted;
  }

  // Brands
  async getBrands(): Promise<Brand[]> {
    return Array.from(this.brands.values());
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    return this.brands.get(id);
  }

  async getBrandByName(name: string): Promise<Brand | undefined> {
    return Array.from(this.brands.values())
      .find(brand => brand.name.toLowerCase() === name.toLowerCase());
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const brand: Brand = {
      id: this.currentBrandId++,
      name: insertBrand.name,
      isCustom: insertBrand.isCustom || false,
    };
    this.brands.set(brand.id, brand);
    return brand;
  }

  // Watches
  async getWatches(collectionId?: number): Promise<Watch[]> {
    const allWatches = Array.from(this.watches.values());
    if (collectionId !== undefined) {
      return allWatches.filter(watch => watch.collectionId === collectionId);
    }
    return allWatches;
  }

  async getWatch(id: number): Promise<Watch | undefined> {
    return this.watches.get(id);
  }

  async createWatch(insertWatch: InsertWatch): Promise<Watch> {
    const watch: Watch = {
      id: this.currentWatchId++,
      collectionId: insertWatch.collectionId,
      name: insertWatch.name,
      brandId: insertWatch.brandId,
      model: insertWatch.model || null,
      purchaseDate: insertWatch.purchaseDate ? new Date(insertWatch.purchaseDate) : null,
      lastServiced: insertWatch.lastServiced ? new Date(insertWatch.lastServiced) : null,
      servicePeriod: insertWatch.servicePeriod || 5,
      valuation: insertWatch.valuation || null,
      details: insertWatch.details || null,
      images: [],
      primaryImageIndex: 0,
      gridPosition: insertWatch.gridPosition || null,
      wearDates: [],
      totalWearDays: 0,
      longestStreak: 0,
      createdAt: new Date(),
    };
    this.watches.set(watch.id, watch);
    return watch;
  }

  async updateWatch(updateWatch: UpdateWatch): Promise<Watch | undefined> {
    const existing = this.watches.get(updateWatch.id);
    if (!existing) return undefined;

    const updated: Watch = {
      id: existing.id,
      collectionId: updateWatch.collectionId ?? existing.collectionId,
      name: updateWatch.name ?? existing.name,
      brandId: updateWatch.brandId ?? existing.brandId,
      model: updateWatch.model ?? existing.model,
      purchaseDate: updateWatch.purchaseDate ? new Date(updateWatch.purchaseDate) : existing.purchaseDate,
      lastServiced: updateWatch.lastServiced ? new Date(updateWatch.lastServiced) : existing.lastServiced,
      servicePeriod: updateWatch.servicePeriod ?? existing.servicePeriod,
      valuation: updateWatch.valuation ?? existing.valuation,
      details: updateWatch.details ?? existing.details,
      images: updateWatch.images ? [...updateWatch.images] : existing.images,
      primaryImageIndex: updateWatch.primaryImageIndex ?? existing.primaryImageIndex,
      gridPosition: updateWatch.gridPosition ?? existing.gridPosition,
      wearDates: updateWatch.wearDates ? [...updateWatch.wearDates] : existing.wearDates,
      totalWearDays: updateWatch.totalWearDays ?? existing.totalWearDays,
      longestStreak: updateWatch.longestStreak ?? existing.longestStreak,
      createdAt: existing.createdAt,
    };
    this.watches.set(updated.id, updated);
    return updated;
  }

  async deleteWatch(id: number): Promise<boolean> {
    return this.watches.delete(id);
  }

  // Helper function to calculate streak
  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    
    const sortedDates = dates.sort();
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }

  async addWearDate(watchId: number, date: string): Promise<Watch | undefined> {
    const watch = this.watches.get(watchId);
    if (!watch) return undefined;

    const wearDates = [...(watch.wearDates || [])];
    if (!wearDates.includes(date)) {
      wearDates.push(date);
      const longestStreak = this.calculateStreak(wearDates);
      
      const updated: Watch = {
        ...watch,
        wearDates,
        totalWearDays: wearDates.length,
        longestStreak,
      };
      
      this.watches.set(watchId, updated);
      return updated;
    }
    
    return watch;
  }

  async removeWearDate(watchId: number, date: string): Promise<Watch | undefined> {
    const watch = this.watches.get(watchId);
    if (!watch) return undefined;

    const wearDates = (watch.wearDates || []).filter(d => d !== date);
    const longestStreak = this.calculateStreak(wearDates);
    
    const updated: Watch = {
      ...watch,
      wearDates,
      totalWearDays: wearDates.length,
      longestStreak,
    };
    
    this.watches.set(watchId, updated);
    return updated;
  }

  async updateWatchPositions(positions: { id: number; gridPosition: number }[]): Promise<void> {
    for (const { id, gridPosition } of positions) {
      const watch = this.watches.get(id);
      if (watch) {
        this.watches.set(id, { ...watch, gridPosition });
      }
    }
  }
}

import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async initialize() {
    try {
      // Check if we have any collections, if not, create default data
      const existingCollections = await db.select().from(collections);
      
      if (existingCollections.length === 0) {
        // Create default collection
        await db
          .insert(collections)
          .values({
            name: "SOTC",
            description: "State of the Collection",
            gridColumns: 4,
            gridRows: 3,
          });

        // Create default brands
        const defaultBrands = [
          { name: "Rolex", isCustom: false },
          { name: "Omega", isCustom: false },
          { name: "Seiko", isCustom: false },
          { name: "Tudor", isCustom: false },
          { name: "Casio", isCustom: false },
          { name: "Tissot", isCustom: false },
          { name: "Breitling", isCustom: false },
          { name: "TAG Heuer", isCustom: false },
          { name: "Citizen", isCustom: false },
          { name: "Patek Philippe", isCustom: false },
          { name: "Audemars Piguet", isCustom: false },
          { name: "Vacheron Constantin", isCustom: false },
          { name: "IWC", isCustom: false },
          { name: "Jaeger-LeCoultre", isCustom: false },
          { name: "Panerai", isCustom: false },
          { name: "Zenith", isCustom: false },
          { name: "Hublot", isCustom: false },
          { name: "Richard Mille", isCustom: false },
          { name: "Cartier", isCustom: false },
          { name: "Longines", isCustom: false },
        ];

        await db.insert(brands).values(defaultBrands);
      }
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  }

  async getCollections(): Promise<Collection[]> {
    return await db.select().from(collections);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(updateCollection: UpdateCollection): Promise<Collection | undefined> {
    if (!updateCollection.id) return undefined;
    
    const [updated] = await db
      .update(collections)
      .set(updateCollection)
      .where(eq(collections.id, updateCollection.id))
      .returning();
    return updated || undefined;
  }

  async deleteCollection(id: number): Promise<boolean> {
    const result = await db.delete(collections).where(eq(collections.id, id));
    return result.changes > 0;
  }

  async getBrands(): Promise<Brand[]> {
    return await db.select().from(brands);
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand || undefined;
  }

  async getBrandByName(name: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.name, name));
    return brand || undefined;
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const [brand] = await db
      .insert(brands)
      .values(insertBrand)
      .returning();
    return brand;
  }

  async getWatches(collectionId?: number): Promise<Watch[]> {
    if (collectionId) {
      return await db.select().from(watches).where(eq(watches.collectionId, collectionId));
    }
    return await db.select().from(watches);
  }

  async getWatch(id: number): Promise<Watch | undefined> {
    const [watch] = await db.select().from(watches).where(eq(watches.id, id));
    return watch || undefined;
  }

  async createWatch(insertWatch: InsertWatch): Promise<Watch> {
    const [watch] = await db
      .insert(watches)
      .values(insertWatch)
      .returning();
    return watch;
  }

  async updateWatch(updateWatch: UpdateWatch): Promise<Watch | undefined> {
    if (!updateWatch.id) return undefined;
    
    const [updated] = await db
      .update(watches)
      .set(updateWatch)
      .where(eq(watches.id, updateWatch.id))
      .returning();
    return updated || undefined;
  }

  async deleteWatch(id: number): Promise<boolean> {
    const result = await db.delete(watches).where(eq(watches.id, id));
    return result.changes > 0;
  }

  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    
    const sortedDates = dates.sort();
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const previousDate = new Date(sortedDates[i - 1]);
      const dayDifference = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  }

  async addWearDate(watchId: number, date: string): Promise<Watch | undefined> {
    const watch = await this.getWatch(watchId);
    if (!watch) return undefined;

    const wearDates = Array.isArray(watch.wearDates) ? watch.wearDates : [];
    
    if (!wearDates.includes(date)) {
      const updatedWearDates = [...wearDates, date];
      const longestStreak = this.calculateStreak(updatedWearDates);
      
      return await this.updateWatch({
        id: watchId,
        wearDates: updatedWearDates,
        totalWearDays: updatedWearDates.length,
        longestStreak,
      });
    }
    
    return watch;
  }

  async removeWearDate(watchId: number, date: string): Promise<Watch | undefined> {
    const watch = await this.getWatch(watchId);
    if (!watch) return undefined;

    const wearDates = Array.isArray(watch.wearDates) ? watch.wearDates : [];
    const updatedWearDates = wearDates.filter(d => d !== date);
    const longestStreak = this.calculateStreak(updatedWearDates);
    
    return await this.updateWatch({
      id: watchId,
      wearDates: updatedWearDates,
      totalWearDays: updatedWearDates.length,
      longestStreak,
    });
  }

  async updateWatchPositions(positions: { id: number; gridPosition: number }[]): Promise<void> {
    for (const { id, gridPosition } of positions) {
      await db
        .update(watches)
        .set({ gridPosition })
        .where(eq(watches.id, id));
    }
  }
}

export const storage = new DatabaseStorage();
