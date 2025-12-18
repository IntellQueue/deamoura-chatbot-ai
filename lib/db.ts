import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// 1. Setup Koneksi
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 30000 // 30s timeout
});

export default pool;

// --- HELPER: Parsing JSON dari Database ---
// Ini PENTING agar varian/warna terbaca sebagai Array di frontend, bukan String
function parseProduct(product: any) {
  if (!product) return null;

  // Helper kecil untuk parse aman
  const safeParse = (data: any) => {
    if (Array.isArray(data)) return data; // Sudah array
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    return []; // Default kosong
  };

  return {
    ...product,
    isActive: !!product.isActive,     // Convert 1/0 ke true/false
    isFeatured: !!product.isFeatured, // Convert 1/0 ke true/false

    // Parse kolom JSON
    materials: safeParse(product.materials),
    colors: safeParse(product.colors),
    variants: safeParse(product.variants),

    // Struktur kategori nested (biar frontend ga perlu ubah kodingan)
    category: product.categoryId ? {
      id: product.categoryId,
      name: product.categoryName,
      slug: product.categorySlug
    } : null
  };
}

// --- Product Queries ---

export async function getAllProductsAdmin() {
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    ORDER BY p.createdAt DESC
  `);
  return (rows as any[]).map(parseProduct);
}

export async function getProducts() {
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    WHERE p.isActive = 1 
    ORDER BY p.createdAt DESC
  `);
  return (rows as any[]).map(parseProduct);
}

export async function getFeaturedProducts() {
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    WHERE p.isActive = 1 AND p.isFeatured = 1 
    ORDER BY p.createdAt DESC 
    LIMIT 8
  `);
  return (rows as any[]).map(parseProduct);
}

export async function getProductBySlug(slug: string) {
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    WHERE p.slug = ? AND p.isActive = 1
  `, [slug]);

  const product = (rows as any[])[0];
  return parseProduct(product);
}

// --- FUNGSI UTAMA GET BY ID (Dipakai di Edit Page) ---
export async function getProductById(id: number) {
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    WHERE p.id = ?
  `, [id]);

  const product = (rows as any[])[0];
  return parseProduct(product);
}

export async function getRandomProducts() {
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    WHERE p.isActive = 1 
    ORDER BY RAND() 
    LIMIT 3
  `);
  return (rows as any[]).map(parseProduct);
}

export async function searchProducts(query: string) {
  if (!query) return [];
  const searchTerm = `%${query}%`;
  const [rows] = await pool.execute(`
    SELECT p.*, c.name as categoryName, c.slug as categorySlug 
    FROM product p 
    LEFT JOIN category c ON p.categoryId = c.id 
    WHERE p.isActive = 1 AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
    LIMIT 3
  `, [searchTerm, searchTerm, searchTerm]);

  return (rows as any[]).map(parseProduct);
}

// --- Category Queries ---
export async function getCategories() {
  const [rows] = await pool.execute('SELECT * FROM category ORDER BY name ASC');
  return rows as any[];
}

export async function searchCategories(query: string) {
  if (!query) return [];
  const searchTerm = `%${query}%`;
  const [rows] = await pool.execute(`
    SELECT * FROM category 
    WHERE name LIKE ? OR description LIKE ? 
    LIMIT 2
  `, [searchTerm, searchTerm]);
  return rows as any[];
}

// --- FAQ Queries ---
export async function getFAQ(query: string) {
  if (!query) return [];
  const searchTerm = `%${query}%`;
  const [rows] = await pool.execute(`
    SELECT * FROM faq 
    WHERE isActive = 1 AND (question LIKE ? OR answer LIKE ?) 
    LIMIT 2
  `, [searchTerm, searchTerm]);
  return rows as any[];
}

// --- Admin Helper: Create Product ---
export async function createProduct(data: any) {
  const { name, slug, description, price, stock, imageUrl, marketplaceUrl, isActive, isFeatured, categoryId, materials, colors, variants } = data;

  const [result] = await pool.execute(`
    INSERT INTO product 
    (name, slug, description, price, stock, imageUrl, marketplaceUrl, isActive, isFeatured, categoryId, materials, colors, variants)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    name,
    slug,
    description,
    price,
    stock,
    imageUrl,
    marketplaceUrl,
    isActive ? 1 : 0, // MySQL boolean
    isFeatured ? 1 : 0,
    categoryId,
    JSON.stringify(materials || []), // Pastikan array kosong kalau null
    JSON.stringify(colors || []),
    JSON.stringify(variants || [])
  ]);

  return { id: (result as any).insertId, ...data };
}

// --- Admin Helper: Update Product ---
export async function updateProduct(id: number, data: any) {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue;
    if (key === 'category') continue; // Jangan update object category
    if (value === undefined) continue;

    // Handle JSON Fields
    if (['materials', 'colors', 'variants'].includes(key)) {
      fields.push(`${key} = ?`);
      // Pastikan stringify, dan handle null
      values.push(value === null ? '[]' : JSON.stringify(value));
    }
    // Handle Boolean Fields (MySQL pakai 1/0)
    else if (['isActive', 'isFeatured'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value ? 1 : 0);
    }
    // Handle Normal Fields
    else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getProductById(id);

  values.push(id); // Untuk WHERE id = ?

  await pool.execute(`UPDATE product SET ${fields.join(', ')} WHERE id = ?`, values);
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  await pool.execute('DELETE FROM product WHERE id = ?', [id]);
  return { id };
}

// --- Admin Auth Helpers ---
export async function createAdmin(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO admin (email, passwordHash, name) VALUES (?, ?, ?)',
    [email, passwordHash, name]
  );
  return { id: (result as any).insertId, email, name };
}

export async function findAdminByEmail(email: string) {
  const [rows] = await pool.execute('SELECT * FROM admin WHERE email = ?', [email]);
  return (rows as any[])[0] || null;
}

export async function verifyAdminPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}