import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const { error, auth } = await verifyAdmin(request)

    const token = request.cookies.get('admin_token')?.value; // Atau sesuaikan dengan nama cookie Anda
    console.log("=== DEBUG CHECK AUTH ===");
    console.log("Cookies received:", request.cookies.getAll());
    console.log("Token value:", token);
    
    if (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, user: auth })
}
