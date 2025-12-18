const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkTables() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };

    console.log('🔌 Connecting to database to check tables...');
    let connection;
    try {
        connection = await mysql.createConnection(config);
        const [rows] = await connection.execute("SHOW TABLES LIKE 'Product'");

        if (rows.length > 0) {
            console.log('✅ Table "Product" exists.');

            // Optional: Check row count
            const [countRows] = await connection.execute("SELECT COUNT(*) as count FROM product");
            console.log(`📊 Product count: ${countRows[0].count}`);
        } else {
            console.log('❌ Table "Product" DOES NOT exist.');
            process.exit(1); // Exit with error code to signal missing table
        }

    } catch (error) {
        console.error('❌ Check failed.');
        console.error('Error config:', { ...config, password: '***' });
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full Error:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkTables();
