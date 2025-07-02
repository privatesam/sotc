import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCollectionSchema, 
  updateCollectionSchema,
  insertBrandSchema,
  insertWatchSchema,
  updateWatchSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), "data", "uploads")
  : path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded images
  app.use('/uploads', express.static(uploadDir));

  // Collections endpoints
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const validatedData = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      res.status(400).json({ message: "Invalid collection data" });
    }
  });

  app.put("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateCollectionSchema.parse({ ...req.body, id });
      const collection = await storage.updateCollection(validatedData);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(400).json({ message: "Invalid collection data" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCollection(id);
      if (!deleted) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Brands endpoints
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    try {
      const validatedData = insertBrandSchema.parse(req.body);
      
      // Check if brand already exists
      const existing = await storage.getBrandByName(validatedData.name);
      if (existing) {
        return res.status(409).json({ message: "Brand already exists" });
      }
      
      const brand = await storage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      res.status(400).json({ message: "Invalid brand data" });
    }
  });

  // Watches endpoints
  app.get("/api/watches", async (req, res) => {
    try {
      const collectionId = req.query.collectionId ? parseInt(req.query.collectionId as string) : undefined;
      const watches = await storage.getWatches(collectionId);
      res.json(watches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watches" });
    }
  });

  app.get("/api/watches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const watch = await storage.getWatch(id);
      if (!watch) {
        return res.status(404).json({ message: "Watch not found" });
      }
      res.json(watch);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watch" });
    }
  });

  app.post("/api/watches", async (req, res) => {
    try {
      const validatedData = insertWatchSchema.parse(req.body);
      const watch = await storage.createWatch(validatedData);
      res.status(201).json(watch);
    } catch (error) {
      res.status(400).json({ message: "Invalid watch data" });
    }
  });

  // Batch update watch positions (must come before /:id routes)
  app.put("/api/watches/positions", async (req, res) => {
    try {
      console.log("Received positions update:", req.body);
      const positions = req.body as { id: number; gridPosition: number }[];
      
      // Validate the request body
      if (!Array.isArray(positions)) {
        return res.status(400).json({ message: "Request body must be an array" });
      }
      
      for (const pos of positions) {
        if (typeof pos.id !== 'number' || typeof pos.gridPosition !== 'number') {
          return res.status(400).json({ message: "Each position must have id and gridPosition as numbers" });
        }
      }
      
      await storage.updateWatchPositions(positions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating watch positions:", error);
      res.status(500).json({ message: "Failed to update watch positions" });
    }
  });

  app.put("/api/watches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateWatchSchema.parse({ ...req.body, id });
      const watch = await storage.updateWatch(validatedData);
      if (!watch) {
        return res.status(404).json({ message: "Watch not found" });
      }
      res.json(watch);
    } catch (error) {
      res.status(400).json({ message: "Invalid watch data" });
    }
  });

  app.delete("/api/watches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWatch(id);
      if (!deleted) {
        return res.status(404).json({ message: "Watch not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete watch" });
    }
  });

  // Image upload endpoint
  app.post("/api/watches/:id/images", upload.array('images', 10), async (req, res) => {
    try {
      const watchId = parseInt(req.params.id);
      const watch = await storage.getWatch(watchId);
      
      if (!watch) {
        return res.status(404).json({ message: "Watch not found" });
      }

      const files = req.files as Express.Multer.File[];
      const newImagePaths = files.map(file => `/uploads/${file.filename}`);
      
      const updatedImages = [...(watch.images || []), ...newImagePaths];
      
      const updatedWatch = await storage.updateWatch({
        id: watchId,
        images: updatedImages
      });

      res.json({ images: updatedWatch?.images || [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // Wear tracking endpoints
  app.post("/api/watches/:id/wear", async (req, res) => {
    try {
      const watchId = parseInt(req.params.id);
      const { date } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      const watch = await storage.addWearDate(watchId, date);
      if (!watch) {
        return res.status(404).json({ message: "Watch not found" });
      }
      
      res.json(watch);
    } catch (error) {
      res.status(500).json({ message: "Failed to add wear date" });
    }
  });

  app.delete("/api/watches/:id/wear/:date", async (req, res) => {
    try {
      const watchId = parseInt(req.params.id);
      const { date } = req.params;
      
      const watch = await storage.removeWearDate(watchId, date);
      if (!watch) {
        return res.status(404).json({ message: "Watch not found" });
      }
      
      res.json(watch);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove wear date" });
    }
  });

  // Delete image endpoint
  app.delete("/api/watches/:id/images/:imageIndex", async (req, res) => {
    try {
      const watchId = parseInt(req.params.id);
      const imageIndex = parseInt(req.params.imageIndex);
      const watch = await storage.getWatch(watchId);
      
      if (!watch) {
        return res.status(404).json({ message: "Watch not found" });
      }

      const images = [...(watch.images || [])];
      if (imageIndex >= 0 && imageIndex < images.length) {
        // Delete file from filesystem
        const imagePath = images[imageIndex];
        const fullPath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        
        images.splice(imageIndex, 1);
        
        // Adjust primary image index if necessary
        let newPrimaryIndex = watch.primaryImageIndex || 0;
        if (imageIndex === newPrimaryIndex && images.length > 0) {
          newPrimaryIndex = 0;
        } else if (imageIndex < newPrimaryIndex) {
          newPrimaryIndex = newPrimaryIndex - 1;
        }
        
        const updatedWatch = await storage.updateWatch({
          id: watchId,
          images,
          primaryImageIndex: Math.max(0, Math.min(newPrimaryIndex, images.length - 1))
        });

        res.json({ images: updatedWatch?.images || [] });
      } else {
        res.status(400).json({ message: "Invalid image index" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
