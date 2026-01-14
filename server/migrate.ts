import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  try {
    console.log("🔄 Checking for database migrations...");
    
    const migrationPath = path.join(process.cwd(), "db/migrations/002_add_cascade_deletes.sql");
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      console.log("✅ No pending migrations");
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    // Split by semicolon and filter out comments and empty statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        await db.execute(sql.raw(statement));
      }
    }
    
    console.log("✅ Database migrations applied successfully!");
  } catch (error: any) {
    // If constraint already exists, that's fine - migration was already applied
    if (error.message && error.message.includes("already exists")) {
      console.log("✅ Migrations already applied");
      return;
    }
    
    console.error("❌ Error applying migrations:", error.message);
    // Don't exit - let the app continue running
  }
}
