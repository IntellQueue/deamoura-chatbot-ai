const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function setup() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Database excluded initially to allow creation
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };

  console.log('🔌 Connecting to Azure MySQL Server...', { host: config.host, user: config.user });

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to server!');

    // Create Database
    const dbName = process.env.DB_NAME;
    console.log(`🔨 Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Using database '${dbName}'`);

    // 1. Drop Tables (Clean Slate)
    console.log('🗑️ Dropping existing tables...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DROP TABLE IF EXISTS Product');
    await connection.execute('DROP TABLE IF EXISTS Category');
    await connection.execute('DROP TABLE IF EXISTS Faq');
    await connection.execute('DROP TABLE IF EXISTS Admin');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Create Tables
    console.log('🏗️ Creating tables...');

    // Category
    await connection.execute(`
      CREATE TABLE Category (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Product
    await connection.execute(`
      CREATE TABLE Product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price INT NOT NULL,
        stock INT DEFAULT 0,
        imageUrl VARCHAR(255),
        marketplaceUrl VARCHAR(255),
        isActive BOOLEAN DEFAULT TRUE,
        isFeatured BOOLEAN DEFAULT FALSE,
        categoryId INT,
        materials JSON,
        colors JSON,
        variants JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE SET NULL
      )
    `);

    // Faq
    await connection.execute(`
      CREATE TABLE Faq (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        isActive BOOLEAN DEFAULT TRUE
      )
    `);

    // Admin
    await connection.execute(`
      CREATE TABLE Admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        passwordHash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Seed Data
    console.log('🌱 Seeding data...');

    // Seed Admin
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password', salt);
    await connection.execute(
      'INSERT INTO Admin (email, passwordHash, name) VALUES (?, ?, ?)',
      ['admin@deamoura.com', hash, 'Admin DeAmoura']
    );

    // Seed Categories
    await connection.execute(`
      INSERT INTO Category (name, slug, description) VALUES 
      ('Pashmina', 'pashmina', 'Koleksi pashmina premium'),
      ('Square', 'square', 'Hijab segi empat'),
      ('Instant', 'instant', 'Hijab instan praktis')
    `);

    // Get Category IDs
    const [cats] = await connection.execute('SELECT id, slug FROM category');
    const pashminaId = cats.find(c => c.slug === 'pashmina')?.id;

    // Seed Product
    await connection.execute(`
      INSERT INTO Product (name, slug, description, price, stock, imageUrl, categoryId, materials, colors, isFeatured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Pashmina Silk Premium',
      'pashmina-silk-premium',
      'Pashmina berbahan silk premium yang lembut, jatuh, dan mewah.',
      85000,
      50,
      'https://images.unsplash.com/photo-1585728748176-455ac6ef00c3?w=800',
      pashminaId,
      JSON.stringify(['Silk', 'Premium']),
      JSON.stringify(['Sage Green', 'Dusty Pink', 'Black']),
      true
    ]);

    // Seed FAQ
    await connection.execute(`
      INSERT INTO Faq (question, answer) VALUES 
      ('Berapa lama pengiriman?', 'Pengiriman biasanya memakan waktu 2-3 hari kerja untuk Jabodetabek.'),
      ('Apakah bisa COD?', 'Ya, kami melayani pembayaran COD untuk seluruh Indonesia.')
    `);

    console.log('✨ Database setup complete!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

setup();
