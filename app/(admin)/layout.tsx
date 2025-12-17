'use client'

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, LogOut, ShoppingBag } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // PASTIKAN INI SESUAI dengan URL login kamu di browser.
  // Kalau URL loginmu adalah localhost:3000/login, biarkan '/login'.
  // Kalau URL loginmu localhost:3000/admin-login, ganti jadi '/admin-login'.
  const isLoginPage = pathname === '/login' || pathname === '/admin-login'; 

  useEffect(() => {
    // Kalau sedang di halaman login, tidak perlu cek auth
    if (isLoginPage) {
        setIsLoading(false);
        return;
    }

    const checkAuth = async () => {
      try {
        // --- PERBAIKAN UTAMA DI SINI ---
        // Tambahkan { credentials: 'include' } agar cookie admin_token terbawa
        const res = await fetch('/api/admin/check-auth', {
            method: 'GET',
            credentials: 'include', // <--- INI KUNCI RAHASIANYA
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        if (res.ok) {
          setIsAuth(true)
        } else {
          // Token tidak valid/expired
          console.log("Auth check failed (401), redirecting to login...")
          router.push('/login') 
        }
      } catch (e) {
        console.error('Auth check error (Network/Server down)', e)
        // Jangan langsung redirect jika error jaringan, tapi opsional:
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  const handleLogout = async () => {
    try {
        // Panggil API Logout supaya server menghapus cookie juga
        await fetch('/api/admin/logout', { method: 'POST' });
        
        // Hapus cookie di client secara paksa (untuk jaga-jaga)
        document.cookie = 'admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        router.push('/login')
        router.refresh()
    } catch (error) {
        console.error("Logout error", error);
        // Tetap paksa keluar
        router.push('/login');
    }
  }

  // --- TAMPILAN KHUSUS HALAMAN LOGIN ---
  if (isLoginPage) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  // --- LOADING STATE ---
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <p>Verifying Access...</p>
        </div>
    )
  }

  // --- PROTEKSI ---
  // Jika loading selesai tapi tidak auth, return null (karena useEffect akan redirect)
  if (!isAuth) {
    return null
  }

  // --- TAMPILAN DASHBOARD ---
  return (
    <div className="flex min-h-screen bg-background">
      {/* SIDEBAR */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 hidden md:block border-r border-sidebar-border/40">
        <div className="p-6 border-b border-sidebar-border/20 flex items-center gap-3">
          <div className="w-8 h-8 premium-gradient rounded-full flex items-center justify-center font-bold text-white shadow-md">
            D
          </div>
          <h1 className="text-xl font-bold font-serif">Admin Panel</h1>
        </div>

        <nav className="mt-6 px-4 space-y-2 flex flex-col h-[calc(100vh-120px)]">
          {/* PERHATIKAN HREF INI: Pastikan route '/admin/products' memang ada */}
          <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors">
            <Package size={20} />
            <span>Kelola Produk</span>
          </Link>

          <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors mt-auto border-t border-sidebar-border/20 pt-4">
            <ShoppingBag size={20} />
            <span>Lihat Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* KONTEN KANAN */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}