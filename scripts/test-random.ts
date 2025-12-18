
import { getRandomProducts } from '../lib/db';

async function main() {
    try {
        console.log("Testing getRandomProducts()...");
        const products = await getRandomProducts();
        console.log(`Found ${products.length} products:`);
        products.forEach(p => console.log(`- ${p.name} (Stok: ${p.stock})`));
    } catch (err) {
        console.error("Error:", err);
    }
}

main();
