import { searchProducts, getFAQ, getFeaturedProducts, getRandomProducts } from "./db";

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  marketplaceUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number;
  materials: any;
  colors: any;
  variants: any;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";

export class DeAmouraChatbot {

  async generateResponse(userMessage: string): Promise<{
    text: string;
    products: Product[];
    categories: any[];
    hasProducts: boolean;
  }> {
    console.log('\n🤖 generateResponse START (REST) - message:', userMessage.substring(0, 30));

    try {
      if (!API_KEY) {
        throw new Error("Gemini API Key is missing");
      }

      // 1. Search Logic
      const cleanMessage = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
      let products: any[] = [];
      let faqs: any[] = [];
      let isRandomRecommendation = false; // Flag to tell AI these are random

      // Strategy A: Direct Search
      console.log('🔍 Strategy A: Direct Search ->', cleanMessage);
      products = await searchProducts(cleanMessage);
      faqs = await getFAQ(cleanMessage);

      // Strategy B: Smart Search (if needed)
      if (products.length === 0) {
        // ... (existing smart search logic omitted for brevity, logic remains same)
        // You can keep the existing smart search logic here or simplify
        const STOP_WORDS = ['ada', 'nggak', 'enggak', 'tidak', 'mau', 'beli', 'cari', 'tolong', 'plis', 'please', 'kak', 'min', 'gan', 'sis', 'hallo', 'halo', 'hai', 'hi', 'apakah', 'yang', 'dan', 'atau', 'di', 'ke', 'dari', 'ini', 'itu', 'dong', 'sih', 'kok', 'punya', 'lihat', 'coba', 'tes'];
        const words = cleanMessage.split(/\s+/);
        const keywords = words.filter(w => !STOP_WORDS.includes(w) && w.length > 2);
        const smartQuery = keywords.join(" ");

        if (smartQuery && smartQuery !== cleanMessage) {
          products = await searchProducts(smartQuery);
        }

        // Strategy C: Individual Keywords
        if (products.length === 0 && keywords.length > 0) {
          // ... (existing keyword fallback)
          const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
          for (const keyword of sortedKeywords) {
            const keywordResults = await searchProducts(keyword);
            if (keywordResults.length > 0) {
              products = keywordResults;
              break;
            }
          }
        }
      }

      // CRITICAL UPDATE: Random Fallback instead of Featured
      if (products.length === 0) {
        console.log('⚠️ No specific products found. Fetching RANDOM products for recommendation.');
        // products = await getFeaturedProducts(); // OLD
        products = await getRandomProducts();      // NEW
        isRandomRecommendation = true;
      }

      // 2. Prepare Context
      const productContext = products.map(p => {
        try {
          // ... (existing safeParse logic)
          const safeParse = (val: any) => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.trim().startsWith('[')) {
              try { return JSON.parse(val); } catch { return []; }
            }
            return typeof val === 'string' ? [val] : [];
          };

          const colors = safeParse(p.colors).join(', ');
          const materials = safeParse(p.materials).join(', ');
          const variants = safeParse(p.variants || [])
            .map((v: any) => `${v.name || 'Varian'}${v.stock ? ` (Stok: ${v.stock})` : ''}`)
            .join(', ');

          return `- ${p.name} (${p.category?.name || 'Hijab'})
  Harga: Rp${p.price?.toLocaleString('id-ID') || '0'}
  Stok Total: ${p.stock ?? 0}
  Featured: ${p.isFeatured ? "Ya (Best Seller)" : "Tidak"}
  Warna/Varian: ${variants || colors || "-"}
  Material: ${materials || "-"}
  Marketplace: ${p.marketplaceUrl || "-"}
  Deskripsi: ${p.description || "Tidak ada deskripsi"}`;
        } catch (err) {
          return `- ${p.name} (Data tidak lengkap)`;
        }
      }).join("\n\n");

      const faqContext = faqs.map(f => `Tanya: ${f.question}\nJawab: ${f.answer}`).join("\n\n");

      const systemPrompt = `
      Kamu adalah "Amoura", asisten AI virtual untuk toko hijab "De Amoura".
      Gunakan Bahasa Indonesia yang ramah, sopan, ceria, dan kekinian (gunakan emoji seperti 💕, ✨, 🌸 dalam porsi yang pas).

      DATA PRODUK (HANYA GUNAKAN DATA INI! JANGAN MENGARANG!):
      ${productContext || "TIDAK ADA DATA."}

      DATA FAQ:
      ${faqContext || "TIDAK ADA DATA FAQ."}

      KONTEKS SISTEM:
      ${isRandomRecommendation
          ? "⚠️ PENCARIAN KOSONG. Sistem otomatis mengambil 3 PRODUK RANDOM DARI DATABASE sebagai saran."
          : "✅ PENCARIAN DITEMUKAN."}

      ATURAN MUTLAK (LANGGAR = ERROR):
      1.  **NO HALLUCINATION**: Kamu DILARANG KERAS menyebutkan nama produk, deskripsi, atau harga yang **TIDAK ADA** di "DATA PRODUK" di atas.
      2.  **CONTOH YANG SALAH**: Jangan pernah mengubah "Pashmina Ceruty" (Data) menjadi "Pashmina Ceruty Babydoll Premium Super" (Karangan). **Gunakan Nama Produk PERSIS sesuai data.**
      3.  **KONDISI DATA KOSONG**: 
          - Jika "DATA PRODUK" tertulis "TIDAK ADA DATA", maka KAMU TIDAK BISA MEMBERI REKOMENDASI APAPUN.
          - Katakan: "Maaf Kak, produk yang dicari belum ada dan stok kami lagi kosong semua. Coba tanya lagi nanti ya! 🙏"
      4.  **LOGIS & JUJUR**:
          - Jika user tanya "Mobil", jawab sopan bahwa ini toko Hijab.
          - Jika "DATA PRODUK" ada isinya, tawarkan produk tersebut sebagai alternatif.
          - Jangan bilang "ini best seller" kecuali data bilang \`isFeatured: true\` atau \`Featured: Ya\`.

      FORMAT JAWABAN (STRICT REFERENCY):
          ✨ **[Nama Produk - COPY PASTE DARI DATA]**
          💰 Harga: [Harga Sesuai Data]
          📦 Stok: [Stok Sesuai Data]
          🎨 Varian: [Warna/Varian Sesuai Data]
          📝 [Deskripsi Sesuai Data - Jangan Mengarang Berlebihan]

      Contoh Interaksi (Jika User tanya "Mobil" & Sistem kasih Random Data):
      User: "Ada mobil?"
      Data: 
      - Pashmina Plisket (Harga: 35.000)
      - Bergo Sport (Harga: 25.000)
      
      Jawab:
      "Waduh, De Amoura cuma jualan Hijab cantik Kak, nggak jual mobil hehe 🤭. Tapi kalau butuh hijab nyaman buat sehari-hari, Amoura ada rekomendasi nih:
      
      ✨ **Pashmina Plisket**
      💰 Harga: Rp35.000
      ...

      ✨ **Bergo Sport**
      💰 Harga: Rp25.000
      ..."

      Pesan User: "${userMessage}"
      `;

      // 3. Call Gemini REST API with Retry Strategy
      const callGemini = async (model: string, retries = 5): Promise<string> => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        const payload = {
          contents: [{ parts: [{ text: systemPrompt }] }]
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              const data = await response.json();
              return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, aku tidak bisa menjawab sekarang.";
            }

            // If error is 503 or 429, we retry
            if (response.status === 503 || response.status === 429) {
              console.warn(`Attempt ${attempt} failed with ${response.status}. Retrying in ${2 * Math.pow(2, attempt - 1)}s...`);
              if (attempt === retries) throw new Error(`Model ${model} overloaded after ${retries} attempts.`);
              // Exponential backoff starting at 2s: 2s, 4s, 8s, 16s...
              await new Promise(res => setTimeout(res, 2000 * Math.pow(2, attempt - 1)));
              continue;
            }

            // For other errors, throw immediately
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);

          } catch (e) {
            if (attempt === retries) throw e;
            console.warn(`Attempt ${attempt} error:`, e);
            await new Promise(res => setTimeout(res, 2000 * Math.pow(2, attempt - 1)));
          }
        }
        throw new Error("Unable to generate response");
      };

      let text = "";
      try {
        console.log(`🤖 Invoking Gemini with ${GEMINI_MODEL}...`);
        text = await callGemini(GEMINI_MODEL, 5);
      } catch (error) {
        console.error("❌ Model failed:", error);
        return {
          text: "Maaf, server AI sedang sibuk sekali (Overload). Mohon tunggu beberapa saat dan coba lagi ya! 🙏",
          products: products,
          categories: [],
          hasProducts: products.length > 0
        };
      }

      console.log('✅ Response generated:', text.substring(0, 50) + '...');

      return {
        text: text,
        products: products,
        categories: [],
        hasProducts: products.length > 0
      };

    } catch (error: any) {
      console.error('❌ Error:', error?.message);
      return {
        text: "Maaf ya, aku lagi gangguan nih. Coba tanya lagi nanti ya! 💕 (System Error)",
        products: [],
        categories: [],
        hasProducts: false
      };
    }
  }
}