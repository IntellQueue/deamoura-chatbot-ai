// src/app/(admin)/admin/products/page.tsx
"use client";

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  stock: number
  category?: { name: string }
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('Produk berhasil dihapus!')
        setProducts(products.filter(p => p.id !== id))
      } else {
        alert('Gagal menghapus produk')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Terjadi error saat menghapus')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      {/* Header Halaman */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-classik-strong">Daftar Produk</h2>
          <p className="text-muted-foreground text-sm">Kelola katalog barang de.amoura disini.</p>
        </div>

        <Link
          href="/d033e22ae348aeb5660fc2140aec35850c4da997/products/add"
          className="premium-gradient hover:shadow-lg text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all"
        >
          <Plus size={18} />
          Tambah Produk
        </Link>
      </div>

      {/* Tabel Produk */}
      <div className="bg-white rounded-2xl shadow-sm border border-classik/20 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-classik/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-classik/10">
            <tr>
              <th className="px-6 py-4">Nama Produk</th>
              <th className="px-6 py-4">Harga</th>
              <th className="px-6 py-4">Stok</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-classik/10">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Tidak ada produk.</td></tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">Rp {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-muted-foreground">{product.stock} pcs</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/d033e22ae348aeb5660fc2140aec35850c4da997/products/${product.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
