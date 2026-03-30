import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./auth";
import { insertJobSchema } from "@shared/schema";
import { runMigrations } from "./migrate";
import { supabaseAdmin } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Run database migrations
  await runMigrations();

  // Initialize database and seed towing services
  await storage.seedTowingServices();

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== PROFILE ====================
  app.get("/api/profile", requireAuth, async (req: any, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      role: req.user.role,
      companyId: req.user.companyId,
      createdAt: req.user.createdAt,
    });
  });

  app.put("/api/profile", requireAuth, async (req: any, res) => {
    try {
      const { displayName } = req.body;
      const user = await storage.updateUserDisplayName(req.user.id, displayName);
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        companyId: user.companyId,
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  // ==================== JOBS ====================

  app.get("/api/jobs", requireAuth, async (req: any, res) => {
    try {
      const jobs = await storage.getAllJobs(req.user.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/recent", requireAuth, async (req: any, res) => {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam && !isNaN(parseInt(limitParam)) ? parseInt(limitParam) : 10;
      const jobs = await storage.getRecentJobs(req.user.id, limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      res.status(500).json({ error: "Failed to fetch recent jobs" });
    }
  });

  app.get("/api/jobs/:id/photos", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const photos = await storage.getJobPhotos(jobId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.get("/api/jobs/:id", requireAuth, async (req, res) => {
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

  app.post("/api/jobs", requireAuth, async (req: any, res) => {
    try {
      const jobData = {
        ...req.body,
        userId: req.user.id,
      };
      const validatedData = insertJobSchema.parse(jobData);
      const job = await storage.createJob(validatedData);
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ error: "Failed to create job" });
    }
  });

  // ==================== SERVICES ====================

  app.get("/api/services", requireAuth, async (_req, res) => {
    try {
      const services = await storage.getTowingServices();
      res.json(services);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.patch("/api/services/:id", requireAuth, async (req, res) => {
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

  app.post("/api/jobs/:jobId/services", requireAuth, async (req, res) => {
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

  // ==================== COMPANY SETTINGS ====================

  app.get("/api/company", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let settings = await storage.getCompanySettings(userId);
      if (!settings) {
        await storage.seedCompanySettings(userId);
        settings = await storage.getCompanySettings(userId);
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  app.put("/api/company", requireAuth, async (req: any, res) => {
    try {
      const settings = await storage.updateCompanySettings({
        ...req.body,
        userId: req.user.id,
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(400).json({ error: "Failed to update company settings" });
    }
  });

  // Logo upload — frontend uploads to Supabase Storage, sends path here
  app.post("/api/company/logo", requireAuth, async (req: any, res) => {
    try {
      const { logoPath } = req.body;
      if (!logoPath) {
        return res.status(400).json({ error: "Logo path is required" });
      }
      const settings = await storage.updateCompanySettings({
        userId: req.user.id,
        companyLogo: logoPath,
      });
      res.json({ logoPath, settings });
    } catch (error) {
      console.error("Error updating logo:", error);
      res.status(400).json({ error: "Failed to update logo" });
    }
  });

  // Photo metadata — frontend uploads to Supabase Storage, sends paths here
  app.post("/api/jobs/:id/photos", requireAuth, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { photos } = req.body; // Array of { path, caption? }

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ error: "No photos provided" });
      }

      const uploadedPhotos = [];
      for (const photo of photos) {
        const saved = await storage.addJobPhoto(jobId, photo.path, photo.caption);
        uploadedPhotos.push(saved);
      }

      res.json({ photos: uploadedPhotos });
    } catch (error) {
      console.error("Error saving photos:", error);
      res.status(500).json({ error: "Failed to save photos" });
    }
  });

  app.delete("/api/photos/:id", requireAuth, async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      await storage.deleteJobPhoto(photoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // ==================== COMPANY JOBS ====================

  app.get("/api/company/jobs", requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.companyId) {
        const jobs = await storage.getAllJobs(user.id);
        return res.json(jobs);
      }
      const jobs = await storage.getCompanyJobs(user.companyId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching company jobs:", error);
      res.status(500).json({ error: "Failed to fetch company jobs" });
    }
  });

  // ==================== ANALYTICS ====================

  app.get("/api/analytics/summary", requireAuth, async (req: any, res) => {
    try {
      const summary = await storage.getAnalyticsSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/revenue", requireAuth, async (req: any, res) => {
    try {
      const revenue = await storage.getMonthlyRevenue(req.user.id);
      res.json(revenue);
    } catch (error) {
      console.error("Error fetching revenue:", error);
      res.status(500).json({ error: "Failed to fetch revenue" });
    }
  });

  app.get("/api/analytics/services", requireAuth, async (req: any, res) => {
    try {
      const serviceStats = await storage.getServiceStats(req.user.id);
      res.json(serviceStats);
    } catch (error) {
      console.error("Error fetching service stats:", error);
      res.status(500).json({ error: "Failed to fetch service stats" });
    }
  });

  // ==================== JOBS SEARCH ====================

  app.get("/api/jobs/search", requireAuth, async (req: any, res) => {
    try {
      const { q, from, to, sort, page, limit } = req.query;
      const results = await storage.searchJobs(req.user.id, {
        query: q as string,
        fromDate: from as string,
        toDate: to as string,
        sortBy: sort as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(results);
    } catch (error) {
      console.error("Error searching jobs:", error);
      res.status(500).json({ error: "Failed to search jobs" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  app.get("/api/admin/users", requireAdmin, async (_req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        companyId: u.companyId,
        createdAt: u.createdAt,
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const { email, password, displayName, role, companyId } = req.body;

      // Create in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      // Create profile
      const user = await storage.createUser({
        authId: authData.user.id,
        email,
        displayName: displayName || email.split("@")[0],
        role: role || "user",
        companyId: companyId || null,
      });

      await storage.seedCompanySettings(user.id);

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        companyId: user.companyId,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id/company", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { companyId } = req.body;
      const user = await storage.updateUserCompany(userId, companyId);
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        companyId: user.companyId,
      });
    } catch (error) {
      console.error("Error updating user company:", error);
      res.status(400).json({ error: "Failed to update user company" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      if (role !== "admin" && role !== "user") {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.updateUserRole(userId, role);
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        companyId: user.companyId,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(400).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // Get user to find their authId for Supabase cleanup
      const user = await storage.getUser(userId);
      if (user?.authId) {
        await supabaseAdmin.auth.admin.deleteUser(user.authId);
      }

      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(400).json({ error: error?.message || "Failed to delete user" });
    }
  });

  app.get("/api/admin/companies", requireAdmin, async (_req: any, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/admin/companies", requireAdmin, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Company name is required" });
      }
      const company = await storage.createCompany({ name });
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(400).json({ error: "Failed to create company" });
    }
  });

  app.delete("/api/admin/companies/:id", requireAdmin, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      await storage.deleteCompany(companyId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(400).json({ error: "Failed to delete company" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
