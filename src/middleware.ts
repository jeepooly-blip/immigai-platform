export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/case/:path*',
    '/cases/:path*',
    '/documents/:path*',
    '/analytics/:path*',
    '/compliance/:path*',
    '/clients/:path*',
    '/settings/:path*',
    '/forms/:path*',
    '/assistant/:path*',
    '/alerts/:path*',
    '/interview-prep/:path*',
    '/admin/:path*',
  ],
}
