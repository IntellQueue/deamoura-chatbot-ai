
require('dotenv').config();
const { getFeaturedProducts } = require('../lib/db');

async function testFeatured() {
    try {
        console.log("Fetching featured products...");
        const products = await getFeaturedProducts();
        console.log(`Found ${products.length} featured products.`);

        if (products.length > 0) {
            console.log("First product:", JSON.stringify(products[0], null, 2));
        } else {
            console.warn("⚠️ No featured products found in DB! This explains why the fallback might be empty.");
        }
    } catch (error) {
        console.error("Error fetching featured products:", error);
    }
    process.exit();
}

testFeatured();
