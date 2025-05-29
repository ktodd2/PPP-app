const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const { Pool } = require('@neondatabase/serverless');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const adminPassword = await hashPassword('admin123');
    const johnPassword = await hashPassword('password');
    const empPassword = await hashPassword('emp123');
    
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', adminPassword]);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['john', johnPassword]);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['employee1', empPassword]);
    
    console.log('Test users created successfully!');
    console.log('Credentials:');
    console.log('admin / admin123');
    console.log('john / password');
    console.log('employee1 / emp123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await pool.end();
  }
}

createUsers();