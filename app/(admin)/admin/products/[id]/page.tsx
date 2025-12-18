// src/app/(admin)/admin/products/[id]/page.tsx
"use client";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Upload, Plus, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductVariant {
  id: string;
  name: string;
  image: string;
}

// Interface Category
interface Category {
  id: number;
  name: string;
}

export const dynamic = 'force-dynamic';
export default function EditProductPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const variantInputRef = useRef<HTMLInputElement>(null);

  // State Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    marketplaceUrl: '',
  });

  // --- 1. FETCH KATEGORI ---
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  // --- 2. FETCH DATA PRODUK ---
  useEffect(() => {
    const pathParts = pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || isNaN(parseInt(id))) {
      router.push('/d033e22ae348aeb5660fc2140aec35850c4da997/products');
      return;
    }

    setProductId(id);

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/admin/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();

        setMainImage(data.image || '');

        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          category: data.categoryId ? data.categoryId.toString() : '',
          price: data.price?.toString() || '',
          stock: data.stock?.toString() || '',
          description: data.description || '',
          marketplaceUrl: data.marketplaceUrl || '',
        });

        // Parse variants
        let variantsData: ProductVariant[] = [];
        if (data.variants) {
          if (typeof data.variants === 'string') {
            try {
              variantsData = JSON.parse(data.variants) || [];
            } catch (e) {
              console.warn('Failed to parse variants:', e);
              variantsData = [];
            }
          } else if (Array.isArray(data.variants)) {
            variantsData = data.variants;
          }
        }
        setVariants(Array.isArray(variantsData) ? variantsData : []);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        alert('Gagal memuat produk');
        router.push('/d033e22ae348aeb5660fc2140aec35850c4da997/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [pathname, router]);

  // --- HELPER: Slug Generator ---
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Hapus karakter aneh
      .trim()
      .replace(/\s+/g, '-');        // Ganti spasi jadi strip
  };

  // --- HELPER: Convert File to Base64 ---
  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // --- HANDLERS ---

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Maksimal 2MB");
      const base64 = await convertToBase64(file);
      setMainImage(base64);
    }
  };

  const handleBulkVariantUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 20) return alert("Maksimal upload 20 foto sekaligus.");

    const promises = Array.from(files).map(async (file) => {
      if (file.size > 2 * 1024 * 1024) return null;
      const base64 = await convertToBase64(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: cleanName,
        image: base64
      };
    });

    const results = await Promise.all(promises);
    const validResults = results.filter((v): v is ProductVariant => v !== null);
    setVariants((prev) => [...prev, ...validResults]);
    if (variantInputRef.current) variantInputRef.current.value = "";
  };

  const updateVariantName = (id: string, newName: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, name: newName } : v));
  };

  const handleRemoveVariant = (id: string) => {
    if (confirm("Hapus varian ini?")) {
      setVariants(variants.filter((v) => v.id !== id));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // LOGIC PINTAR:
      // Kalau user ngetik "Nama", kita update Nama DAN generate Slug baru otomatis.
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }));
    } else {
      // Kalau user ngetik di kolom "Slug" (atau field lain), kita update field itu saja.
      // Ini yang bikin slug BISA diedit manual tanpa diganggu nama.
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- ACTION BUTTONS ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainImage) return alert("Foto utama wajib ada!");
    if (!formData.name || !formData.slug) return alert("Nama dan Slug wajib diisi!");
    if (!productId) return alert("Product ID tidak ditemukan");

    setIsLoading(true);
    try {
      const imageBase64 = mainImage.startsWith('http') || mainImage.startsWith('/')
        ? mainImage
        : mainImage;

      const colors = variants.map(v => v.name);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,

          // Kirim ID Kategori (Angka)
          categoryId: formData.category ? parseInt(formData.category) : null,

          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0,
          description: formData.description,
          marketplaceUrl: formData.marketplaceUrl,

          imageBase64: imageBase64,
          variants: variants,
          materials: colors,
          colors: colors,
          isActive: true
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update product');
      }

      alert("Produk berhasil diperbarui!");
      router.push('/d033e22ae348aeb5660fc2140aec35850c4da997/products');
      router.refresh();
    } catch (error) {
      console.error('Error updating product:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return alert("Product ID tidak ditemukan");
    if (confirm("PERINGATAN FINAL: Apakah Anda yakin ingin menghapus produk ini selamanya?")) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to delete product');
        }

        alert("Produk berhasil dihapus!");
        router.push('/d033e22ae348aeb5660fc2140aec35850c4da997/products');
        router.refresh();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/d033e22ae348aeb5660fc2140aec35850c4da997/products"
          className="p-2 bg-white border border-classik/20 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-classik-strong">Edit Produk</h2>
          <p className="text-muted-foreground text-sm">Update informasi produk ID: <span className="font-mono text-amber-600">{productId || 'Loading...'}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-classik/20 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* KIRI: FOTO & VARIAN */}
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Foto Sampul Utama</label>
              <div className={`relative w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center overflow-hidden transition-colors ${mainImage ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-muted'}`}>
                {mainImage ? (
                  <>
                    <img src={mainImage} alt="Cover" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setMainImage("")} className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full z-20 shadow-sm hover:bg-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : (
                  <div className="p-6">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Klik untuk ganti foto sampul</p>
                    <input type="file" accept="image/*" onChange={handleMainImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/30 p-5 rounded-xl border border-classik/10">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-foreground">Varian Warna ({variants.length})</label>
                <div className="relative">
                  <button type="button" className="premium-gradient text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:shadow-md transition-all">
                    <Plus size={16} />
                    Tambah Foto
                  </button>
                  <input type="file" multiple accept="image/*" ref={variantInputRef} onChange={handleBulkVariantUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-classik/20 rounded-lg bg-white/50">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada varian.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {variants.map((variant) => (
                    <div key={variant.id} className="relative bg-white p-2 rounded-lg border border-classik/20 shadow-sm group hover:border-primary/50 transition-all">
                      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                        <img src={variant.image} alt={variant.name} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveVariant(variant.id)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input type="text" value={variant.name} onChange={(e) => updateVariantName(variant.id, e.target.value)} className="w-full text-xs font-medium text-center border border-transparent hover:border-input focus:border-ring focus:bg-white bg-transparent rounded px-1 py-1 outline-none transition-all placeholder-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KANAN: DETAIL INFO */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Nama Produk</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Slug (URL)</label>
              <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all font-mono text-sm" required />
              <p className="text-xs text-muted-foreground mt-1">Otomatis berubah mengikuti nama produk, atau bisa diedit manual.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kategori</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none bg-white transition-all">
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Stok Total</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Harga (Rp)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Link Tokopedia</label>
              <input type="url" name="marketplaceUrl" value={formData.marketplaceUrl} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" placeholder="https://tokopedia.com/..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Deskripsi Lengkap</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={8} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none resize-none transition-all"></textarea>
            </div>

            <div className="pt-6 border-t border-classik/10 flex items-center justify-between gap-4">
              <button type="button" onClick={handleDelete} className="px-6 py-3 text-red-600 font-medium hover:bg-red-50 rounded-full transition-colors flex items-center gap-2 border border-transparent hover:border-red-100">
                <Trash2 size={20} />
                Hapus
              </button>

              <button type="submit" disabled={isLoading} className="px-8 py-3 premium-gradient hover:shadow-lg hover:shadow-primary/20 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2">
                {isLoading ? 'Menyimpan...' : (
                  <>
                    <Save size={20} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}