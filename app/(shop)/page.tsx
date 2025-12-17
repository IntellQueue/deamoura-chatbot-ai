// app/shop/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag, Search, X, ArrowLeft, Heart,
  Share2, Star, Package, Truck, RotateCcw,
  Instagram, Phone, MapPin, Grid, List
} from 'lucide-react';
import Image from 'next/image';
import { ChatbotComponent } from '@/components/chatbot-component';
import LogoImage from './Logo.jpeg';
import { Lock } from 'lucide-react';

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  colors: string[];
  materials: string[];
  marketplaceUrl?: string;
  category?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

// --- HELPER FUNCTION ---
const safeJsonParse = (data: any): any[] => {
  if (!data) return [];
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return [];
    }
  }
  return Array.isArray(data) ? data : [];
};

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productSlug = searchParams.get('product');

  // --- STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: 'Semua Produk' }
  ]);

  // --- EFFECTS ---

  // Handle Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Data
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle URL Param for Product
  useEffect(() => {
    if (productSlug && products.length > 0) {
      const product = products.find(p => p.slug === productSlug);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [productSlug, products]);

  // --- API CALLS ---
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data: Category[] = await res.json();
        const formattedCategories = [
          { id: 'all', name: 'Semua Produk' },
          ...data.map(cat => ({
            id: cat.name.toLowerCase(),
            name: cat.name
          }))
        ];
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor(null);
    router.push(`/?product=${product.slug}`, { scroll: false });
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    setSelectedColor(null);
    router.push('/', { scroll: false });
  };

  // --- FILTERING LOGIC ---
  const filteredProducts = products.filter(product => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (product.category?.name && product.category.name.toLowerCase() === selectedCategory.toString().toLowerCase());

    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // --- SUB-COMPONENTS (RENDER HELPERS) ---

  const Header = () => (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'glass py-2 border-b border-white/20' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-primary">
                <img
                  src={LogoImage.src}
                  alt="de.amoura Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">de.amoura</h1>
                <p className="text-xs text-primary/80">Hijab & Fashion Muslim</p>
              </div>
            </div>
          </div>
          <a
            href="https://www.tokopedia.com/de-amoura"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-6 py-2.5 premium-gradient text-white rounded-full overflow-hidden shadow-lg transition-all hover:shadow-primary/25"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <div className="flex items-center space-x-2 relative z-10">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm font-medium">Shop Now</span>
            </div>
          </a>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="premium-gradient text-white py-4 mt-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-primary">
                <img
                  src={LogoImage.src}
                  alt="de.amoura Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold font-serif leading-tight">de.amoura</h3>
                <p className="text-accent text-[10px] tracking-widest uppercase">Elegance in Modesty</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Keanggunan dalam setiap helai hijab. Premium, nyaman, dan bergaya.
            </p>
          </div>

          <div className="text-left md:text-right">
            <h4 className="text-sm font-bold text-white mb-3">Kontak</h4>
            <div className="space-y-2 inline-flex flex-col items-start md:items-end">
              <a href="https://instagram.com/de.amoura" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-primary-foreground/80 hover:text-white transition-colors text-sm">
                <Instagram className="w-4 h-4" />
                <span>@de.amoura</span>
              </a>
              <a href="https://wa.me/6282284796648" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-primary-foreground/80 hover:text-white transition-colors text-sm">
                <Phone className="w-4 h-4" />
                <span>+62 822-8479-6648</span>
              </a>
              <div className="flex items-center space-x-2 text-sm text-primary-foreground/80">
                <MapPin className="w-4 h-4" />
                <span>Bandung, Indonesia</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 pt-6 mt-8 text-center relative">
          <p className="text-xs text-primary-foreground/60">
            &copy; {new Date().getFullYear()} de.amoura.
          </p>
          <button 
            onClick={() => {
              document.cookie = "akses_rahasia=true; path=/";
              // Arahkan ke URL "Topeng"
              window.location.href = '/2736fab291f04e69b62d490c3c09361f5b82461a'; 
            }}
            className="absolute right-0 top-6 p-2 text-white/10 hover:text-white transition-colors"
            title="Admin Login"
          >
            <Lock className="w-3 h-3" />
          </button>
        </div>
      </div>
      
    </footer>
  );

  const ProductDetailModal = () => {
    if (!selectedProduct) return null;

    const colors = safeJsonParse(selectedProduct.colors);
    const materials = safeJsonParse(selectedProduct.materials);
    const variants = safeJsonParse((selectedProduct as any).variants);

    // --- LOGIKA VARIAN GAMBAR ---
    const currentVariant = selectedColor 
      ? variants.find((v: any) => v.name === selectedColor) 
      : null;

    const displayImage = currentVariant?.image || selectedProduct.imageUrl;
    // ----------------------------

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary flex flex-col">
          <div className="bg-primary text-primary-foreground p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <button onClick={handleCloseProduct} className="flex items-center hover:bg-primary/90 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali
            </button>
            <div className="flex items-center gap-4">
              <button onClick={handleCloseProduct} className="hover:bg-primary/90 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="md:grid md:grid-cols-2 gap-8 items-start">
              <div className="mb-6 md:mb-0 md:max-w-sm">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-gray-100 flex items-center justify-center transition-all duration-300">
                  {displayImage ? (
                    <Image 
                      key={displayImage} // Force re-render animation
                      src={displayImage} 
                      alt={selectedProduct.name} 
                      fill 
                      className="object-cover animate-in fade-in duration-300" 
                    />
                  ) : (
                    <ShoppingBag className="w-24 h-24 text-gray-400" />
                  )}
                </div>
              </div>

              <div>
                <div className="mb-4">
                  {selectedProduct.category && (
                    <span className="inline-block bg-secondary text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {selectedProduct.category.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h1>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-primary">Rp {selectedProduct.price.toLocaleString()}</p>
                </div>

                {colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Warna Tersedia</h3>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color: string, index: number) => {
                        const variant = variants?.find((v: any) => v.name === color);
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedColor(color)}
                            className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${selectedColor === color ? 'border-primary bg-secondary shadow-md' : 'border-border hover:border-primary/60'}`}
                            title={color}
                          >
                            {variant && variant.image ? (
                              <div className="relative w-6 h-6 rounded-full mr-3 border border-gray-300 overflow-hidden bg-gray-50">
                                <Image src={variant.image} alt={color} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full mr-3 border border-gray-400 shadow-sm" style={{ backgroundColor: color.toLowerCase() }} />
                            )}
                            <span className="text-sm font-medium">{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">Tentang Produk</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                </div>

                <div className="flex gap-4 mt-4">
                  <a href={selectedProduct.marketplaceUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex-[2] premium-gradient text-white text-center py-4 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center">Beli Sekarang</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-background selection:bg-accent/30 selection:text-primary">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16 relative py-12 bg-secondary/30 rounded-3xl border border-classik/20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent/10 blur-[80px] -z-10 rounded-full"></div>
          <span className="inline-block py-1 px-3 rounded-full bg-accent/10 text-accent-foreground text-xs font-semibold tracking-wider mb-4 border border-accent/20">NEW COLLECTION 2025</span>
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-serif">Discover Your Elegance</h2>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 space-y-4">
          {/* Search Input */}
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Cari hijab, gamis, atau aksesoris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/80 backdrop-blur shadow-sm transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 w-5 h-5" />
          </div>

          {/* Filter & View Mode */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-transparent px-4 rounded-xl">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory.toString() === cat.id.toString()
                    ? 'premium-gradient text-white shadow-md transform scale-105'
                    : 'bg-white text-classik-strong border border-classik hover:bg-secondary/50'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex bg-secondary rounded-full p-1 border border-primary/20 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm transform scale-105' : 'text-primary/60 hover:text-primary'}`}
                title="Tampilan Grid"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-primary shadow-sm transform scale-105' : 'text-primary/60 hover:text-primary'}`}
                title="Tampilan List"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 bg-secondary/20 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-2">Produk tidak ditemukan</h3>
            <p className="text-muted-foreground mb-6">
              Maaf, kami tidak dapat menemukan apa yang Anda cari.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-accent font-medium hover:text-primary transition-colors underline underline-offset-4"
            >
              Bersihkan Pencarian
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-classik/40 cursor-pointer flex flex-col h-full"
                onClick={() => handleOpenProduct(product)}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary/10">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-classik-strong border border-classik/20 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      {product.category.name}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium text-center">Lihat Detail</p>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                    {product.description}
                  </p>
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Harga</p>
                      <span className="text-lg font-bold text-primary">
                        Rp {product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 mb-20">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all border border-border cursor-pointer flex gap-6 items-center"
                onClick={() => handleOpenProduct(product)}
              >
                <div className="w-32 h-32 relative rounded-xl overflow-hidden flex-shrink-0 bg-secondary/10">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {product.category && (
                        <span className="text-xs font-medium text-accent mb-2 block uppercase tracking-wider">
                          {product.category.name}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 max-w-xl">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        Rp {product.price.toLocaleString()}
                      </p>
                      {product.stock < 10 && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          Sisa {product.stock} pcs!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <ProductDetailModal />
      <ChatbotComponent />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background animate-pulse" />}>
      <ShopContent />
    </Suspense>
  );
}