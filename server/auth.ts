import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Send notification email to admin when new user signs up
async function sendNewUserNotification(newUserEmail: string, newUserDisplayName: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured - skipping admin notification email");
    return;
  }

  try {
    // Get admin users to notify
    const admins = await storage.getAdminUsers();
    if (admins.length === 0) {
      console.log("No admin users found to notify");
      return;
    }

    const adminEmails = admins.map(a => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PPP App <noreply@resend.dev>",
        to: adminEmails,
        subject: `New User Signup: ${newUserEmail}`,
        html: `
          <h2>New User Registration</h2>
          <p>A new user has signed up and is waiting for approval:</p>
          <ul>
            <li><strong>Email:</strong> ${newUserEmail}</li>
            <li><strong>Display Name:</strong> ${newUserDisplayName}</li>
          </ul>
          <p>Please log in to the admin dashboard to approve or reject this user.</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send notification email:", errorText);
    } else {
      console.log("Admin notification email sent successfully");
    }
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
}

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
    let isNewUser = false;

    // Auto-create profile on first login
    if (!profile) {
      const displayName = authUser.user_metadata?.display_name || authUser.email?.split("@")[0] || "User";
      profile = await storage.createUser({
        authId: authUser.id,
        email: authUser.email || "",
        displayName,
      });
      // Seed default company settings
      await storage.seedCompanySettings(profile.id);
      isNewUser = true;

      // Send notification email to admin (async, don't block)
      sendNewUserNotification(profile.email, displayName).catch(console.error);
    }

    // Block unapproved users
    if (!profile.approved) {
      return res.status(403).json({
        message: "pending_approval",
        displayName: profile.displayName,
      });
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
