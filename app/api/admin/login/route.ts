import { NextRequest, NextResponse } from 'next/server'
import { findAdminByEmail, verifyAdminPassword } from '@/lib/db'
import { JWT_SECRET } from '@/lib/auth'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Validasi input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Cek database
    const admin = await findAdminByEmail(email)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Cek password
    const ok = await verifyAdminPassword(password, admin.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    // Bikin Token
    const token = jwt.sign({ sub: String(admin.id), email: admin.email }, JWT_SECRET, { expiresIn: '7d' })

    const response = NextResponse.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } })

    // --- PERBAIKAN KRUSIAL DISINI ---
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: false, // <--- WAJIB FALSE DI LOCALHOST. Kalau true, browser menolak simpan.
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    })
    // --------------------------------

    return response
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}