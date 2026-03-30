import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Middleware to extract and verify Supabase JWT, attach user profile to req.user
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Get the app user profile linked to this auth user
    let profile = await storage.getUserByAuthId(authUser.id);

    // Auto-create profile on first login
    if (!profile) {
      profile = await storage.createUser({
        authId: authUser.id,
        email: authUser.email || "",
        displayName: authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "User",
      });
      // Seed default company settings
      await storage.seedCompanySettings(profile.id);
    }

    req.user = profile;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
}

// Middleware for admin-only routes
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // requireAuth must run first
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}
