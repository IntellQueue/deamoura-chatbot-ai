import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout & Tiket Diberikan' })

  // 1. HAPUS Token Admin (Biar logout)
  response.cookies.delete('admin_token')

  // 2. KASIH TIKET MASUK (Server yang set, biar pasti nempel)
  response.cookies.set('akses_rahasia', 'true', {
    path: '/',
    httpOnly: false, // Penting biar bisa dibaca middleware
    maxAge: 3600 // Tiket berlaku 1 jam
  })
  
  return response
}