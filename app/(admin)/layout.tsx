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

  // Cek apakah user sedang berada di halaman login
  // Sesuaikan '/login' ini dengan URL halaman login admin kamu
  // Cek apakah user sedang berada di halaman login (URL Hash atau /login internal)
  const isLoginPage = pathname === '/login' || pathname === '/2736fab291f04e69b62d490c3c09361f5b82461a';

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
          router.push('/') // Lempar ke Home kalau belum auth (Middleware akan blok /login langsung)
        }
      } catch (e) {
        console.error('Auth check failed', e)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  const handleLogout = () => {
    // Hapus Token Admin & Tiket Rahasia (Biar pintu kekunci lagi)
    document.cookie = 'admin_token=; path=/; max-age=0'
    document.cookie = 'akses_rahasia=; path=/; max-age=0'

    // Redirect ke Home
    window.location.href = '/'
  }

  // --- TAMPILAN KHUSUS HALAMAN LOGIN ---
  if (isLoginPage) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  // --- TAMPILAN ADMIN PANEL (DENGAN SIDEBAR) ---

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