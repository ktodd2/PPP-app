import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database and seed towing services
  await storage.seedTowingServices();

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
      const services = await storage.getTowingServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
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
