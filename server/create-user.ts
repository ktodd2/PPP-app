import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createUser(username: string, password: string) {
  try {
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      password: hashedPassword,
    });
    
    // Seed company settings for the new user
    await storage.seedCompanySettings(user.id);
    
    console.log(`User created successfully:`);
    console.log(`Username: ${username}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Created at: ${user.createdAt}`);
    
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Example usage (uncomment and run to create users):
// createUser("admin", "admin123").then(() => process.exit(0));
// createUser("john", "password123").then(() => process.exit(0));
// createUser("employee1", "emp123").then(() => process.exit(0));