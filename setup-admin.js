import { db } from "./server/db.js";
import { users, companies } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function runMigration() {
  console.log("🚀 Setting up admin user system...\n");

  try {
    // Step 1: Create companies table
    console.log("📦 Creating companies table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Companies table created\n");

    // Step 2: Create user_role enum
    console.log("🏷️  Creating user_role enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✅ User role enum created\n");

    // Step 3: Add role and company_id columns
    console.log("⚙️  Adding role and company_id columns to users table...");
    await db.execute(sql`
      ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user'
    `);
    await db.execute(sql`
      ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)
    `);
    console.log("✅ Columns added\n");

    // Step 4: Create index
    console.log("📊 Creating index...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id)
    `);
    console.log("✅ Index created\n");

    // Step 5: Promote user to admin
    const username = await question("Enter username to make admin (or press Enter to skip): ");
    
    if (username && username.trim()) {
      const result = await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.username, username.trim()))
        .returning();

      if (result.length > 0) {
        console.log(`\n✅ User '${username}' is now an admin!`);
      } else {
        console.log(`\n⚠️  User '${username}' not found. You can promote them later.`);
      }
    }

    console.log("\n🎉 Setup complete!");
    console.log("\n📝 Next steps:");
    console.log("1. Login with your admin account");
    console.log("2. Access the Admin Dashboard from the sidebar");
    console.log("3. Create companies and assign users to them");
    console.log("4. Users in the same company will see each other's invoices\n");

  } catch (error) {
    console.error("❌ Error during setup:", error);
    console.error("\nIf you see 'column already exists' errors, the migration may have already run.");
  } finally {
    rl.close();
    process.exit(0);
  }
}

runMigration();
