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
      createdAt: existing.createdAt,
    };
    this.watches.set(updated.id, updated);
    return updated;
  }

  async deleteWatch(id: number): Promise<boolean> {
    return this.watches.delete(id);
  }
}

export const storage = new MemStorage();
