'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Save, X, Plus, Image as ImageIcon, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProductVariant {
  id: string
  name: string
  image: string
}

export default function AddProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const variantInputRef = useRef<HTMLInputElement>(null)

  const [mainImage, setMainImage] = useState<string>("")
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    marketplaceUrl: '',
  })

  const [variants, setVariants] = useState<ProductVariant[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      fileReader.onload = () => resolve(fileReader.result as string)
      fileReader.onerror = (error) => reject(error)
    })
  }

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await convertToBase64(file)
        setMainImage(base64)
      } catch (err) {
        alert("Error converting image: " + String(err))
      }
    }
  }

  const handleBulkVariantUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (files.length > 20) return alert("Maksimal upload 20 foto sekaligus.")

    const newVariants: ProductVariant[] = []
    const fileArray = Array.from(files)

    const promises = fileArray.map(async (file) => {
      try {
        const base64 = await convertToBase64(file)
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ")
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: cleanName,
          image: base64
        }
      } catch (err) {
        console.error("Error converting file:", file.name, err)
        return null
      }
    })

    const results = await Promise.all(promises)
    const validResults = results.filter((v): v is ProductVariant => v !== null)

    setVariants((prev) => [...prev, ...validResults])

    if (variantInputRef.current) variantInputRef.current.value = ""
  }

  const updateVariantName = (id: string, newName: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, name: newName } : v))
  }

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mainImage) return alert("Foto utama produk wajib diisi!")
    if (variants.length === 0) return alert("Minimal masukan satu varian warna!")
    if (!formData.slug) return alert("Slug produk wajib diisi!")

    setIsLoading(true)

    try {
      const colors = variants.map(v => v.name)

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,

          // 5. UBAH BAGIAN INI: Convert string ke Int
          categoryId: formData.category ? parseInt(formData.category) : null,

          materials: variants.map(v => v.name),
          colors: colors,
          imageBase64: mainImage,
          variants: variants,
          marketplaceUrl: formData.marketplaceUrl,
          isActive: true,
          isFeatured: false
        })
      })

      if (!res.ok) {
        const err = await res.json()
        alert(`Error: ${err.error}`)
        setIsLoading(false)
        return
      }

      alert("Produk berhasil ditambahkan!")
      router.push('/d033e22ae348aeb5660fc2140aec35850c4da997/products')
    } catch (error) {
      console.error('Submit error:', error)
      alert("Terjadi error saat menyimpan produk")
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/d033e22ae348aeb5660fc2140aec35850c4da997/products" className="p-2 bg-white border border-classik/20 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-classik-strong">Tambah Produk Baru</h2>
          <p className="text-muted-foreground text-sm">Masukan foto produk berdasarkan varian warnanya.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-classik/20 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="space-y-8">

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Foto Sampul Utama</label>
              <div className={`relative w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center overflow-hidden transition-colors ${mainImage ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-muted'}`}>
                {mainImage ? (
                  <>
                    <Image src={mainImage} alt="Cover" fill className="object-cover" />
                    <button type="button" onClick={() => setMainImage("")} className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full z-20 shadow-sm hover:bg-red-600 transition-colors">
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <div className="p-6">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Klik untuk upload foto sampul</p>
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
                    Upload Foto
                  </button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={variantInputRef}
                    onChange={handleBulkVariantUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-classik/20 rounded-lg bg-white/50">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada varian.</p>
                  <p className="text-xs text-muted-foreground/80">Klik tombol di atas untuk upload banyak foto sekaligus.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {variants.map((variant) => (
                    <div key={variant.id} className="relative bg-white p-2 rounded-lg border border-classik/20 shadow-sm group hover:border-primary/50 transition-all">
                      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                        <Image src={variant.image} alt={variant.name} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="absolute top-1 right-1 bg-white/90 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariantName(variant.id, e.target.value)}
                        className="w-full text-xs font-medium text-center border border-transparent hover:border-input focus:border-ring focus:bg-white bg-transparent rounded px-1 py-1 outline-none transition-all placeholder-muted-foreground"
                        placeholder="Nama Warna"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Nama Produk</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" placeholder="Contoh: Pashmina Plisket Premium" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Slug (URL)</label>
              <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" placeholder="pashmina-plisket-premium" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Kategori</label>

                {/* 6. UBAH SELECT INI */}
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none bg-white transition-all"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {/* Mapping data dari state categories */}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Stok Total</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" placeholder="0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Harga (Rp)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" placeholder="Contoh: 85000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Link Tokopedia</label>
              <input type="url" name="marketplaceUrl" value={formData.marketplaceUrl} onChange={handleChange} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none transition-all" placeholder="https://tokopedia.com/..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Deskripsi Lengkap</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring outline-none resize-none transition-all" placeholder="Jelaskan detail produk..."></textarea>
            </div>

            <div className="pt-6 border-t border-classik/10 flex justify-end">
              <button type="submit" disabled={isLoading} className="w-full sm:w-auto px-8 py-3 premium-gradient hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 text-white font-medium rounded-full transition-all flex items-center justify-center gap-2">
                {isLoading ? 'Menyimpan...' : <><Save size={20} /> Simpan Produk</>}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
