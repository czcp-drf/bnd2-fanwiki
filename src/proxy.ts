import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/bongstagram' || pathname.startsWith('/bongstagram/')) {
    return new NextResponse(null, { status: 404 })
  }

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/bongstagram', '/bongstagram/:path*'],
}
