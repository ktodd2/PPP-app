import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if ckelemen user already exists
    const existingUser = await pool.query('SELECT username FROM users WHERE username = $1', ['ckelemen']);
    
    if (existingUser.rows.length > 0) {
      console.log('User "ckelemen" already exists!');
      return;
    }
    
    // Only create the new user
    const ckelemenPassword = await hashPassword('milstead205');
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['ckelemen', ckelemenPassword]);
    
    console.log('New user created successfully!');
    console.log('Credentials:');
    console.log('ckelemen / milstead205');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await pool.end();
  }
}

createUsers();