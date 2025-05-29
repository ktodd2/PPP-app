import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database and seed towing services and company settings
  await storage.seedTowingServices();
  await storage.seedCompanySettings();

  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Create a new job
  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
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

  // Get recent jobs
  app.get("/api/jobs/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const jobs = await storage.getRecentJobs(limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ error: "Failed to fetch recent jobs" });
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
  app.get("/api/company", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  // Update company settings
  app.put("/api/company", async (req, res) => {
    try {
      const settings = await storage.updateCompanySettings(req.body);
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
