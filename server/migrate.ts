import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  console.log("🔄 [MIGRATION] Starting migration check...");
  console.log("🔄 [MIGRATION] Current working directory:", process.cwd());
  
  try {
    const migrationPath = path.join(process.cwd(), "db/migrations/002_add_cascade_deletes.sql");
    console.log("🔄 [MIGRATION] Looking for migration at:", migrationPath);
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      console.log("✅ [MIGRATION] No pending migrations - file not found");
      return;
    }
    
    console.log("✅ [MIGRATION] Migration file found, reading...");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    console.log("✅ [MIGRATION] Migration SQL loaded, length:", migrationSQL.length);
    
    // Split by semicolon and filter out comments and empty statements
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));
    
    console.log(`✅ [MIGRATION] Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        console.log(`🔄 [MIGRATION] Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}...`);
        await db.execute(sql.raw(statement));
        console.log(`✅ [MIGRATION] Statement ${i + 1} completed`);
      }
    }
    
    console.log("✅✅✅ [MIGRATION] All database migrations applied successfully!");
  } catch (error: any) {
    console.error("❌ [MIGRATION] Error occurred:", error);
    // If constraint already exists, that's fine - migration was already applied
    if (error.message && (error.message.includes("already exists") || error.message.includes("duplicate"))) {
      console.log("✅ [MIGRATION] Migrations already applied (constraints exist)");
      return;
    }
    
    console.error("❌ [MIGRATION] Failed to apply migrations:", error.message);
    console.error("❌ [MIGRATION] Full error:", error);
    // Don't exit - let the app continue running
  }
}
