import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertJobSchema } from "@shared/schema";

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express, upload: any): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Initialize database and seed towing services
  await storage.seedTowingServices();



  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs(req.user?.id || 0);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Get recent jobs - MUST come before /api/jobs/:id
  app.get("/api/jobs/recent", requireAuth, async (req: any, res) => {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam && !isNaN(parseInt(limitParam)) ? parseInt(limitParam) : 10;
      const userId = req.user.id;
      const jobs = await storage.getRecentJobs(userId, limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ error: "Failed to fetch recent jobs" });
    }
  });

  // Get job photos (must come before general job route)
  app.get("/api/jobs/:id/photos", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const photos = await storage.getJobPhotos(jobId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // Get a specific job with its services
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // Create a new job
  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const jobData = {
        ...req.body,
        userId: req.user?.id
      };
      const validatedData = insertJobSchema.parse(jobData);
      const job = await storage.createJob(validatedData);
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ error: "Failed to create job" });
    }
  });

  // Get towing services
  app.get("/api/services", async (req, res) => {
    try {
      console.log("Fetching services from database...");
      const services = await storage.getTowingServices();
      console.log("Services fetched:", services.length);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services", details: error.message });
    }
  });



  // Update service rate
  app.patch("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rate } = req.body;
      
      await storage.updateTowingServiceRate(id, rate);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating service rate:", error);
      res.status(400).json({ error: "Failed to update service rate" });
    }
  });

  // Get company settings
  app.get("/api/company", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const settings = await storage.getCompanySettings(userId);
      if (!settings) {
        // Create default settings for new user
        await storage.seedCompanySettings(userId);
        const newSettings = await storage.getCompanySettings(userId);
        res.json(newSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  // Upload logo
  app.post("/api/company/logo", requireAuth, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const logoPath = `/uploads/${req.file.filename}`;
      const settings = await storage.updateCompanySettings({ 
        userId,
        companyLogo: logoPath 
      });
      res.json({ logoPath, settings });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(400).json({ error: "Failed to upload logo" });
    }
  });

  // Upload job photos
  app.post("/api/jobs/:id/photos", upload.array('photos', 20), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No photos provided" });
      }

      const uploadedPhotos = [];
      for (const file of files) {
        const photoPath = `/uploads/${file.filename}`;
        const photo = await storage.addJobPhoto(jobId, photoPath);
        uploadedPhotos.push(photo);
      }
      
      res.json({ photos: uploadedPhotos });
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });



  // Delete job photo
  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      await storage.deleteJobPhoto(photoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Update company settings
  app.put("/api/company", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.updateCompanySettings({
        ...req.body,
        userId
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(400).json({ error: "Failed to update company settings" });
    }
  });

  // Create invoice services for a job
  app.post("/api/jobs/:jobId/services", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { services } = req.body;
      
      await storage.createInvoiceServices(jobId, services);
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating invoice services:", error);
      res.status(400).json({ error: "Failed to create invoice services" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
