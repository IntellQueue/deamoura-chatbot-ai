import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // --- CONFIG HASH (UBAH SESUKA HATI DI SINI) ---
  const HASH_LOGIN = '/2736fab291f04e69b62d490c3c09361f5b82461a'   // Ini "Topeng" buat Login
  const HASH_ADMIN = '/d033e22ae348aeb5660fc2140aec35850c4da997'      // Ini "Topeng" buat Admin
  // ---------------------------------------------

  // Ambil Token & Tiket
  const secretTicket = request.cookies.get('akses_rahasia')
  const adminToken = request.cookies.get('admin_token')

  // 1. BLOKIR AKSES KE FOLDER ASLI (JANGAN KASIH ORANG BUKA /login ATAU /admin LANGSUNG)
  if (path.startsWith('/login') || path.startsWith('/admin')) {
    // Tendang ke Home seolah-olah halaman itu gak ada
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. HANDLER LOGIN HASH (/pintu-rahasia-x99)
  if (path === HASH_LOGIN) {
    // KITA HAPUS AUTO-REDIRECT INI
    // User minta: "selalu dan selalu harus login dulu"
    // if (adminToken) {
    //   return NextResponse.redirect(new URL(HASH_ADMIN + '/products', request.url))
    // }

    // HAPUS DEPENDENSI COOKIE "TIKET"
    // Jadi kalau user tahu URL hash ini, dia bisa masuk walau cookie dihapus
    // if (!secretTicket) {
    //   return NextResponse.redirect(new URL('/', request.url))
    // }
    // INI KUNCINYA: Tampilkan isi folder /login, tapi URL tetap hash
    return NextResponse.rewrite(new URL('/login', request.url))
  }

  // 3. HANDLER ADMIN HASH (/dashboard-k8s7...)
  if (path.startsWith(HASH_ADMIN)) {
    // Cek Token Login
    if (!adminToken) {
      // Kalau gak login, balikin ke Hash Login
      // Tapi karena kita pakai rewrite, kita redirect manual aja
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Kita harus mapping path hash ke path asli
    // Contoh: /dashboard-k8s7/products  -->  /admin/products
    const realPath = path.replace(HASH_ADMIN, '/admin')
    return NextResponse.rewrite(new URL(realPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Matcher harus nangkep URL Hash DAN URL Asli
  matcher: [
    '/login',
    '/admin/:path*',
    '/2736fab291f04e69b62d490c3c09361f5b82461a',
    '/d033e22ae348aeb5660fc2140aec35850c4da997/:path*'
  ]
}